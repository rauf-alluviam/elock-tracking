import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
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
app.use(morgan('combined'));
app.use(cors({
  // Allow specific origins for HTTP environments
  origin: [
    'http://localhost:3005', // E-Lock system
    'http://localhost:5173', // Development frontend
    'http://localhost:3001', // Client application
    'http://localhost:9001', // Server application
    'http://127.0.0.1:3000', // Local IP address alternative
    'http://127.0.0.1:5173', // Local IP address alternative
    // Add production domains as needed
    process.env.CLIENT_URL, // From environment variable
    process.env.ADDITIONAL_CLIENT_URL // Optional additional URL
  ].filter(Boolean), // Remove undefined/null entries
  credentials: true, // Allow cookies in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Auth-Token'], // Headers that browsers are allowed to access
  maxAge: 86400 // How long the results of a preflight request can be cached (in seconds)
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
