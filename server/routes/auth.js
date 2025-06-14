import express from 'express';

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
router.get('/me', (req, res) => {
  // For demo purposes, return a mock user
  res.json({
    success: true,
    user: {
      username: 'admin',
      role: 'admin'
    }
  });
});

export default router;
