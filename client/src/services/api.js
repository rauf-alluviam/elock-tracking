import axios from "axios";
import { getAuthToken, saveAuthToken, clearAuthTokens } from "../utils/cookies";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://15.207.11.214:5004/api";

// Create axios instance with credentials to send/receive cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: Send cookies with cross-origin requests
});

// Add token to every request if available
api.interceptors.request.use((config) => {
  // Get token from cookies first, then fall back to storage
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear all tokens
      clearAuthTokens();

      // Redirect to login
      window.location.href =
        "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login";
    }
    return Promise.reject(error);
  }
);

// API Service functions
export const apiService = {
  // Token handling methods
  getTokenFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    return token ? token.trim() : null;
  },

  saveToken: (token, persist = true) => {
    if (!token) return false;

    const cleanToken = token.trim();

    // Use cookie utility to save token (cookies + localStorage for redundancy)
    saveAuthToken(cleanToken, persist);

    // Remove token from URL to prevent leaking in browser history
    const url = new URL(window.location);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.toString());

    return true;
  },

  verifyToken: async (token) => {
    try {
      const response = await api.post("/auth/verify-token", { token });
      return response.data;
    } catch (error) {
      console.error("❌ Token verification failed:", error);
      return { success: false, error: error.message };
    }
  },

  // Simplified SSO processing
  processSsoToken: async (redirectOnFailure = true) => {
    try {
      console.log("🔍 processSsoToken: Starting token processing...");

      // Get token from URL first
      const urlToken = apiService.getTokenFromUrl();
      console.log(
        "🔎 processSsoToken: URL token:",
        urlToken ? "Found" : "Not found"
      );

      let tokenToProcess = urlToken;

      if (!tokenToProcess) {
        console.log(
          "⚠️ processSsoToken: No URL token, checking stored tokens (cookies + localStorage)..."
        );

        // Check for stored tokens using cookie utility (checks cookies first, then localStorage)
        const storedToken = getAuthToken();

        console.log(
          "📦 processSsoToken: Stored token found:",
          storedToken ? "Yes" : "No"
        );

        if (!storedToken) {
          throw new Error(
            "No authentication token found in URL, cookies, or storage"
          );
        }

        tokenToProcess = storedToken;
        console.log("🔑 processSsoToken: Using stored token");
      }

      console.log("🔍 processSsoToken: About to verify token...");

      // Verify token server-side
      const verification = await apiService.verifyToken(tokenToProcess);
      console.log(
        "✅ processSsoToken: Token verification result:",
        verification
      );

      if (verification.success) {
        console.log(
          "✅ processSsoToken: Token verification successful, saving token..."
        );

        // Save valid token
        apiService.saveToken(tokenToProcess, true);

        return verification;
      } else {
        throw new Error(verification.error || "Token verification failed");
      }
    } catch (error) {
      console.error("❌ processSsoToken: Error occurred:", error);

      const errorResult = { success: false, error: error.message };

      if (redirectOnFailure) {
        console.log("🔄 processSsoToken: Redirecting to login page...");

        // Add a small delay to ensure logs are visible
        setTimeout(() => {
          window.location.href =
            "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login";
        }, 1000);
      }

      return errorResult;
    }
  },

  // Get user data
  getUserData: async () => {
    try {
      // Get token from storage
      const token =
        localStorage.getItem("exim_sso_token") ||
        localStorage.getItem("jwt_token") ||
        sessionStorage.getItem("jwt_token");
      if (!token) {
        return { success: false, error: "No authentication token found" };
      }
      // Use verify-token API to get user data
      const response = await api.post("/auth/verify-token", {
        token: token.trim(),
      });

      if (response.data.success) {
        // Enhance user data with IE code information
        const userData = response.data.user || response.data;
        return {
          success: true,
          user: {
            ...userData,
            // Ensure ieCodes array exists for compatibility
            ieCodes: userData.ie_codes || [userData.ie_code_no].filter(Boolean),
            ieCodeAssignments: userData.ie_code_assignments || [],
            // Backward compatibility
            ieCodeNo:
              userData.ie_code_no ||
              (userData.ie_codes && userData.ie_codes[0]) ||
              "",
          },
        };
      }
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user data via verify-token:", error);
      return { success: false, error: error.message };
    }
  },

  // MAIN E-LOCK ASSIGNMENT ENDPOINT - Single optimized endpoint
  getElockAssignments: async ({
    page = 1,
    limit = "",
    search = "",
    status = "",
    filterType = "",
    ieCodeNo = "",
  } = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(status && { status }),
        ...(filterType && { filterType }),
        ...(ieCodeNo && { ieCodeNo }),
      };



      const response = await api.get("/elock/assignments", { params });

      console.log("✅ Assignments response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching assignments:", error);
      throw error;
    }
  },

  // ==================== E-LOCK MANAGEMENT ENDPOINTS ====================

  // Get all e-lock details with pagination and filters
  getElockDetails: async (params = {}) => {
    try {
      console.log("🔍 Fetching e-lock details with params:", params);

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/elock-details`,
        { params }
      );

      console.log("✅ E-lock details response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching e-lock details:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch e-lock details",
      };
    }
  },

  // Get single e-lock detail
  getElockDetail: async (id) => {
    try {
      const response = await api.get(`/elock-details/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching e-lock detail:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch e-lock detail",
      };
    }
  },

  // Create new e-lock detail
  createElockDetail: async (data) => {
    try {
      console.log("📝 Creating e-lock detail:", data);

      const response = await api.post("/elock-details", data);

      console.log("✅ E-lock detail created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating e-lock detail:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create e-lock detail",
      };
    }
  },

  // Update e-lock detail
  updateElockDetail: async (id, data) => {
    try {
      console.log("📝 Updating e-lock detail:", id, data);

      const response = await api.put(`/elock-details/${id}`, data);

      console.log("✅ E-lock detail updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating e-lock detail:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update e-lock detail",
      };
    }
  },

  // Delete e-lock detail
  deleteElockDetail: async (id) => {
    try {
      console.log("🗑️ Deleting e-lock detail:", id);

      const response = await api.delete(`/elock-details/${id}`);

      console.log("✅ E-lock detail deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting e-lock detail:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete e-lock detail",
      };
    }
  },

  // Bulk update e-lock status
  bulkUpdateElockStatus: async (elockIds, status) => {
    try {
      console.log("🔄 Bulk updating e-lock status:", { elockIds, status });

      const response = await api.patch("/elock-details/bulk/status", {
        elock_ids: elockIds,
        status,
      });

      console.log("✅ Bulk status update completed:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error in bulk status update:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update e-lock status",
      };
    }
  },

  // ==================== EXISTING ENDPOINTS ====================

  // Asset location tracking
  getAssetLocation: async (assetId) => {
    try {
      const response = await api.get(`/elock/location/${assetId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching asset location:", error);
      throw error;
    }
  },

  // Device unlock
  unlockDevice: async (assetId) => {
    try {
      const response = await api.post(`/elock/unlock/${assetId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error unlocking device:", error);
      throw error;
    }
  },

  // Service status check
  getServiceStatus: async () => {
    try {
      const response = await api.get("/elock/status");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching service status:", error);
      return { success: false, error: error.message };
    }
  },

  // Get elock assignment limits
  getElockAssignLimits: async (ieCodeNo, type) => {
    try {
      // Use our backend proxy instead of direct third-party call
      const response = await api.get("/elock/assign-limits", {
        params: { ieCodeNo, type },
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching limits via proxy:", error);
      return { success: false, error: error.message };
    }
  },
};

export { api };
export default apiService;
