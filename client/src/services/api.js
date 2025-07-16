import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://15.207.11.214:5004/api';

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
  const token = localStorage.getItem('exim_sso_token') || 
               localStorage.getItem('jwt_token') || 
               sessionStorage.getItem('jwt_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// API Service functions
export const apiService = {
  // Token handling methods
  getTokenFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    return token ? token.trim() : null;
  },

  saveToken: (token, persist = false) => {
    if (!token) return false;
    
    const cleanToken = token.trim();
    
    // Save with both keys for compatibility
    localStorage.setItem('exim_sso_token', cleanToken);
    localStorage.setItem('jwt_token', cleanToken);
    
    if (!persist) {
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

  // Simplified SSO processing
  processSsoToken: async (redirectOnFailure = true) => {
    try {
      console.log('🔍 processSsoToken: Starting token processing...');
      
      // Get token from URL first
      const urlToken = apiService.getTokenFromUrl();
      console.log('🔎 processSsoToken: URL token:', urlToken ? 'Found' : 'Not found');
      
      let tokenToProcess = urlToken;
      
      if (!tokenToProcess) {
        console.log('⚠️ processSsoToken: No URL token, checking stored tokens...');
        
        // Check for stored tokens
        const storedToken = localStorage.getItem('exim_sso_token') || 
                           localStorage.getItem('jwt_token') || 
                           sessionStorage.getItem('jwt_token');
        
        console.log('📦 processSsoToken: Stored token found:', storedToken ? 'Yes' : 'No');
        
        if (!storedToken) {
          throw new Error('No authentication token found in URL or storage');
        }
        
        tokenToProcess = storedToken;
        console.log('🔑 processSsoToken: Using stored token');
      }
      
      console.log('🔍 processSsoToken: About to verify token...');
      
      // Verify token server-side
      const verification = await apiService.verifyToken(tokenToProcess);
      console.log('✅ processSsoToken: Token verification result:', verification);
      
      if (verification.success) {
        console.log('✅ processSsoToken: Token verification successful, saving token...');
        
        // Save valid token
        apiService.saveToken(tokenToProcess, true);
        
        return verification;
      } else {
        throw new Error(verification.error || 'Token verification failed');
      }
    } catch (error) {
      console.error('❌ processSsoToken: Error occurred:', error);
      
      const errorResult = { success: false, error: error.message };
      
      if (redirectOnFailure) {
        console.log('🔄 processSsoToken: Redirecting to login page...');
        
        // Add a small delay to ensure logs are visible
        setTimeout(() => {
          window.location.href = 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login';
        }, 1000);
      }
      
      return errorResult;
    }
  },

  // Get user data
  getUserData: async () => {
    try {
      // Get token from storage
      const token = localStorage.getItem('exim_sso_token') || 
                    localStorage.getItem('jwt_token') || 
                    sessionStorage.getItem('jwt_token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }
      // Use verify-token API to get user data
      const response = await api.post('/auth/verify-token', { token: token.trim() });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user data via verify-token:', error);
      return { success: false, error: error.message };
    }
  },

  // MAIN E-LOCK ASSIGNMENT ENDPOINT - Single optimized endpoint
  getElockAssignments: async ({ 
    page = 1, 
    limit = 100, 
    search = '', 
    status = '', 
    filterType = '', 
    ieCodeNo = '' 
  } = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(status && { status }),
        ...(filterType && { filterType }),
        ...(ieCodeNo && { ieCodeNo })
      };

      console.log('🔍 Fetching assignments with params:', params);
      
      const response = await api.get('/elock/assignments', { params });
      
      console.log('✅ Assignments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      throw error;
    }
  },

  // Asset location tracking
  getAssetLocation: async (assetId) => {
    try {
      const response = await api.post('/elock/location', { assetId });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching asset location:', error);
      throw error;
    }
  },

  // Device unlock
  unlockDevice: async (assetId) => {
    try {
      const response = await api.post('/elock/unlock', { assetId });
      return response.data;
    } catch (error) {
      console.error('❌ Error unlocking device:', error);
      throw error;
    }
  },

  // Service status check
  getServiceStatus: async () => {
    try {
      const response = await api.get('/elock/status');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching service status:', error);
      return { success: false, error: error.message };
    }
  }
};

export { api };
export default apiService;