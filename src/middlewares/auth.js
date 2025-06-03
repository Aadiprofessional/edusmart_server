const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

// Middleware to validate user authentication
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Middleware to ensure UID is provided in the request body
const validateUid = (req, res, next) => {
  if (!req.body.uid) {
    return res.status(400).json({ error: 'User ID (uid) is required' });
  }
  next();
};

// Middleware to check if user has admin privileges
const isAdmin = async (req, res, next) => {
  try {
    // Get user details from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (data.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Server error during admin verification' });
  }
};

module.exports = {
  authenticateUser,
  validateUid,
  isAdmin
}; 