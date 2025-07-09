const { supabase, supabaseAdmin } = require('../utils/supabase');

// Middleware to validate user authentication using Supabase Auth
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
      // Verify token with Supabase Auth
      const { data: { user }, error } = await supabase().auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      // Attach user info to request (no need to check profiles table for user_profiles routes)
      req.user = user;
      req.userId = user.id;
      req.userEmail = user.email;
      req.userRole = 'user'; // Default role for regular users
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Middleware to validate user authentication and check profiles table (for admin routes)
const authenticateUserWithProfile = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    try {
      // Verify token with Supabase Auth
      const { data: { user }, error } = await supabase().auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      // Get user profile to get role information
      const { data: profile, error: profileError } = await supabase()
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Attach user info to request
      req.user = user;
      req.userId = user.id;
      req.userEmail = user.email;
      req.userRole = profile.role;
      req.userProfile = profile;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Middleware to ensure UID is provided in the request body (for backward compatibility)
const validateUid = (req, res, next) => {
  if (!req.body.uid) {
    return res.status(400).json({ error: 'User ID (uid) is required' });
  }
  next();
};

// Middleware to check if user has admin privileges
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Check if provided UID has admin role (no authentication required)
const checkAdminByUid = async (req, res, next) => {
  try {
    // Get UID from body (for POST/PUT) or query (for GET)
    const uid = req.body.uid || req.query.uid;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }
    
    // Get user profile from database using admin client
    const { data: profile, error } = await supabaseAdmin()
      .from('profiles')
      .select('id, role, name, email')
      .eq('id', uid)
      .single();
    
    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Attach user info to request
    req.userId = profile.id;
    req.userRole = profile.role;
    req.userProfile = profile;
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase().auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase().auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if user is admin (you can customize this logic)
    if (user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Admin verification failed' });
  }
};

module.exports = {
  authenticateUser,
  authenticateUserWithProfile,
  validateUid,
  isAdmin,
  checkAdminByUid,
  verifyToken,
  checkAdmin
}; 