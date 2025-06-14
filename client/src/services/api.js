import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service functions
export const apiService = {
  // Authentication
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // E-Lock Operations
  getAssignments: async (page = 1, limit = 100, search = '') => {
    const response = await api.get('/elock/assignments', {
      params: { page, limit, search }
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
