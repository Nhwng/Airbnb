const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.isLoggedIn = async (req, res, next) => {
  const token = req.cookies.token || 
                (req.header('Authorization') && req.header('Authorization').replace('Bearer ', '')) ||
                req.query.token; // Support token in URL query parameters for SSE

  if (!token) {
    console.log('Authentication failed - no token found in cookies, headers, or query params');
    console.log('Raw cookies:', req.headers.cookie);
    console.log('Parsed cookies:', req.cookies);
    console.log('Session:', req.session);
    console.log('Authorization header:', req.header('Authorization'));
    console.log('Query token:', req.query.token);
    console.log('Request origin:', req.headers.origin);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    return res.status(401).json({
      success: false,
      message: 'Login first to access this page',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findOne({ user_id: decoded.user_id });
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};