import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from SSO
 * Token can be in three places:
 * 1. URL query parameter: ?token=xxx
 * 2. Authorization header: Bearer xxx
 * 3. Cookie: token=xxx
 * 
 * For HTTP compatibility, this implementation prioritizes URL tokens
 * which allows for direct link-based authentication without headers.
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from different sources
    let token = null;
    let tokenSource = null;
    
    // Check URL query parameter (highest priority for HTTP compatibility)
    if (req.query && req.query.token) {
      token = req.query.token.trim();
      tokenSource = 'url';
    }
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1].trim();
      tokenSource = 'header';
    }
    // Check cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token.trim();
      tokenSource = 'cookie';
    }

    // If no token found but we're in SSO mode, redirect to login
    if (!token) {
      // Only enforce token if SSO_MODE is enabled
      if (process.env.SSO_ENABLED === 'true') {
        return res.status(401).json({
          success: false,
          error: 'Authentication token is required',
          redirect: process.env.LOGIN_REDIRECT_URL || 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login',
          message: 'No authentication token found'
        });
      } else {
        // If SSO not enforced, continue without token
        console.log('⚠️ No token provided, but SSO not enforced. Allowing access.');
        next();
        return;
      }
    }

    // Verify token - trim the secret to handle any accidental whitespace
    const jwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not configured in environment variables!');
      return res.status(500).json({
        success: false,
        error: 'Server authentication configuration error',
        message: 'JWT_SECRET is not configured'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Validate the token structure
    if (!decoded.ie_code_no) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token structure: missing ie_code_no field',
        message: 'Token is missing required fields'
      });
    }
    
    // Set user data in request
    req.userData = decoded;
    req.ieCodeNo = decoded.ie_code_no;
    req.tokenSource = tokenSource;
    
    // Log user access
    console.log(`✅ Authenticated user with IE Code: ${decoded.ie_code_no} (token from ${tokenSource})`);
    
    next();
  } catch (error) {
    console.error('❌ JWT Verification failed:', error.message);
    
    // Different error responses based on error type
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        errorType: 'expired',
        message: 'Your session has expired. Please login again.',
        redirect: process.env.LOGIN_REDIRECT_URL || 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token signature',
        errorType: 'invalid',
        message: 'Authentication failed: ' + error.message,
        redirect: process.env.LOGIN_REDIRECT_URL || 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication error: ' + error.message,
        errorType: 'unknown',
        message: 'An unexpected authentication error occurred',
        redirect: process.env.LOGIN_REDIRECT_URL || 'http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login'
      });
    }
  }
};

export default verifyToken;
