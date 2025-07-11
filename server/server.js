import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import elockRoutes from './routes/elock.js';
import authRoutes from './routes/auth.js';
import verifyToken from './middlewares/jwtAuth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  // Allow HTTP for development environment
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));

app.use(cors({
  // Allow specific origins for HTTP environments
origin: [
  'http://localhost:3005',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:9001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://13.201.247.240:9005', // <-- Only the host, not the full API path
  process.env.CLIENT_URL,
  process.env.ADDITIONAL_CLIENT_URL
].filter(Boolean),// Remove undefined/null entries
  credentials: true, // Allow cookies in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Auth-Token'], // Headers that browsers are allowed to access
  maxAge: 86400 // How long the results of a preflight request can be cached (in seconds)
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/api/proxy/client-elock-assign', async (req, res) => {
  try {
    const { page, limit, ieCodeNo } = req.query;
    
    // Make request to external API
    const response = await axios.get('http://13.201.247.240:9005/api/client-elock-assign', {
      params: { page, limit, ieCodeNo },
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Express-Proxy-Server',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Forward the response
    res.json(response.data);
  } catch (error) {
    console.error('Proxy API Error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({
        error: 'External API Error',
        message: error.response.data?.message || error.message,
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to reach external API',
        details: error.message
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

// Routes
app.use('/api/auth', authRoutes);
// Apply JWT verification middleware to elock routes
app.use('/api/elock', verifyToken, elockRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'E-Lock Tracking Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Fixed unlock URL to use icloud.assetscontrols.com
// Updated unlock functionality to use correct iCloud API
// Updated unlock to follow React pattern: AssetID -> FGUID -> Unlock
// Added timeouts to prevent ECONNRESET errors

export default app;
