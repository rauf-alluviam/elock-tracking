import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request if available
api.interceptors.request.use(config => {
  // Get token from localStorage or sessionStorage
  const token = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// API Service functions
export const apiService = {
  // Authentication
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_token');
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Token handling methods
  getTokenFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    // Trim the token to handle potential whitespace issues
    return token ? token.trim() : null;
  },

  saveToken: (token, persist = false) => {
    if (!token) return false;
    
    // Trim the token to handle any whitespace issues
    const cleanToken = token.trim();
    
    if (persist) {
      localStorage.setItem('jwt_token', cleanToken);
    } else {
      sessionStorage.setItem('jwt_token', cleanToken);
    }
    
    // Remove token from URL to prevent leaking in browser history
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.toString());
    
    return true;
  },

  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify-token', { token });
      return response.data;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return { success: false, error: error.message };
    }
  },

  // SSO processing
  processSsoToken: async (redirectOnFailure = true) => {
    try {
      const token = apiService.getTokenFromUrl();
      
      if (!token) {
        // Check if we already have a stored token
        const storedToken = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }
        return { success: true, message: 'Using stored token' };
      }
      
      // Verify token server-side
      const verification = await apiService.verifyToken(token);
      
      if (verification.success) {
        // Save valid token
        apiService.saveToken(token, true); // true = persist in localStorage
        return verification;
      } else {
        throw new Error(verification.error || 'Invalid token');
      }
    } catch (error) {
      console.error('❌ SSO token processing failed:', error);
      
      if (redirectOnFailure) {
        // Redirect to login page
        // window.location.href = 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login';
        window.location.href='http://localhost:3001/login'; // For local development
      }
      
      return { success: false, error: error.message };
    }
  },

  // E-Lock Operations
  getAssignments: async (page = 1, limit = 100, search = '', status = '') => {
    const response = await api.get('/elock/assignments', {
      params: { page, limit, search, status }
    });
    return response.data;
  },
  getAssetLocation: async (assetId) => {
    const response = await api.post('/elock/location', { assetId });
    return response.data;
  },

  getMultipleAssetLocations: async (assetIds) => {
    const response = await api.post('/elock/locations/multiple', { assetIds });
    return response.data;
  },

  getDeviceLocation: async (deviceId) => {
    const response = await api.post('/elock/device-location', { deviceId });
    return response.data;
  },

  unlockDevice: async (assetId) => {
    const response = await api.post('/elock/unlock', { assetId });
    return response.data;
  },
  getServiceStatus: async () => {
    const response = await api.get('/elock/status');
    return response.data;
  },

  getICloudServiceStatus: async () => {
    const response = await api.get('/elock/icloud-status');
    return response.data;
  }
};

export default apiService;
