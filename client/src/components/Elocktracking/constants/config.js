// Time range options
export const timeRangeOptions = [
  { value: "6h", label: "6 Hours Ago", hours: 6 },
  { value: "12h", label: "12 Hours Ago", hours: 12 },
  { value: "1d", label: "1 Day", hours: 24 },
  { value: "3d", label: "3 Days", hours: 72 },
  { value: "8d", label: "8 Days", hours: 192 },
  { value: "15d", label: "15 Days", hours: 360 },
  { value: "1m", label: "1 Month", hours: 720 },
  { value: "custom", label: "Custom Range", hours: 0 },
];

// API Configuration
export const API_CONFIG = {
  TOKEN_ID: "e36d2589-9dc3-4302-be7d-dc239af1846c",
  ADMIN_API_URL: "http://icloud.assetscontrols.com:8092/OpenApi/Admin",
  LBS_API_URL: "http://icloud.assetscontrols.com:8092/OpenApi/LBS",
  SERVER_URL: import.meta.env.VITE_API_BASE_URL || "http://15.207.11.214:5004/api",
  // SERVER_URL: process.env.VITE_API_BASE_URL || "http://localhost:5004/api", // Uncomment for local development
};

// Socket Configuration
export const SOCKET_CONFIG = {
  transports: ["polling", "websocket"],
  timeout: 45000,
  forceNew: true,
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 3,
  randomizationFactor: 0.5,
  upgrade: true,
  rememberUpgrade: false,
};
