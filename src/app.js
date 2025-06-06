const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const courseRoutes = require('./routes/courseRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const universityRoutes = require('./routes/universityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Initialize app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    // Add your production frontend URLs here
    'https://edusmart-admin.vercel.app',
    'https://edusmart-frontend.vercel.app',
    'https://edusmart.vercel.app',
    'https://edusmart-admin.pages.dev',
    'https://edusmart-9z4.pages.dev',
    // Add any other frontend domains you might use
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.pages\.dev$/,
  ],
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', blogRoutes);
app.use('/api', courseRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api', responseRoutes);
app.use('/api', scholarshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/uploads', uploadRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduSmart API',
    version: '1.0.1',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      blogs: '/api/blogs',
      courses: '/api/courses',
      caseStudies: '/api/case-studies',
      responses: '/api/responses',
      scholarships: '/api/scholarships',
      users: '/api/users',
      userProfile: '/api/user',
      applications: '/api/applications',
      universities: '/api/universities',
      uploads: '/api/uploads'
    }
  });
});

// Debug endpoint to check environment variables (remove after debugging)
app.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    PORT: process.env.PORT,
    // Don't expose actual values for security
    supabase_url_length: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
    supabase_key_length: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0,
    service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0
  });
});

// Debug endpoint to test Supabase connection
app.get('/debug/supabase', async (req, res) => {
  try {
    const { supabase, supabaseAdmin } = require('./utils/supabase');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    res.json({
      supabase_initialized: !!supabase,
      supabase_admin_initialized: !!supabaseAdmin,
      connection_test: testError ? 'FAILED' : 'SUCCESS',
      error: testError ? testError.message : null,
      data_count: testData ? testData.length : 0
    });
  } catch (error) {
    res.json({
      error: 'Failed to test Supabase connection',
      message: error.message
    });
  }
});

// Debug endpoint to test token validation
app.post('/debug/token', async (req, res) => {
  try {
    const { supabase } = require('./utils/supabase');
    const { token } = req.body;
    
    if (!token) {
      return res.json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    res.json({
      token_valid: !error,
      user_found: !!user,
      error: error ? error.message : null,
      user_id: user ? user.id : null,
      user_email: user ? user.email : null
    });
  } catch (error) {
    res.json({
      error: 'Failed to validate token',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 