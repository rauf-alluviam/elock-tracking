import express from 'express';
import jwt from 'jsonwebtoken';
import verifyToken from '../middlewares/jwtAuth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Dashboard authentication (if needed for frontend)
 */
router.post('/login', async (req, res) => {
  try {
    // For now, this is a simple placeholder for dashboard authentication
    // You can implement proper authentication later if needed
    
    const { username, password } = req.body;

    // Simple validation (replace with proper authentication)
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          username,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Dashboard logout
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', verifyToken, (req, res) => {
  // Get user data from verified token
  if (req.userData) {
    res.json({
      success: true,
      user: {
        ieCodeNo: req.ieCodeNo,
        ...req.userData
      }
    });
  } else {
    // Fallback to mock user if token not available
    res.json({
      success: true,
      user: {
        username: 'admin',
        role: 'admin'
      }
    });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify JWT token from SSO
 * 
 * This endpoint verifies a token and returns user information if valid.
 * It can be used by the client to validate tokens obtained from URL parameters.
 */
router.post('/verify-token', (req, res) => {
  try {
    // Token can be in body or as a query parameter for HTTP compatibility
    let token = req.body.token;
    
    // Also check query parameter if not in body (for direct HTTP access)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication token is required for verification'
      });
    }
    
    // Trim token to handle any accidental whitespace
    token = token.trim();
    
    // Verify the token - trim the secret to handle any accidental whitespace
    const jwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not configured in environment variables!');
      return res.status(500).json({
        success: false,
        error: 'Server authentication configuration error',
        message: 'JWT_SECRET is not configured'
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check that the token contains expected fields
    if (!decoded.ie_code_no) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token structure: missing ie_code_no field',
        message: 'The token is missing required fields for authentication'
      });
    }
    
    // Return success with user data
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        ieCodeNo: decoded.ie_code_no,
        name: decoded.name || 'User',
        ...decoded
      },
      // Add expiry information for the client
      expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      expiresIn: decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : null
    });
    console.log("Response", res.json);
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    // Different error responses based on error type
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        errorType: 'expired',
        message: 'Your session has expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token signature',
        errorType: 'invalid',
        message: 'Authentication failed: ' + error.message
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication error: ' + error.message,
        errorType: 'unknown',
        message: 'An unexpected authentication error occurred'
      });
    }
  }
});

export default router;
