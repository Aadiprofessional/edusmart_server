const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enhancedCourseRoutes = require('./routes/enhancedCourseRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const universityRoutes = require('./routes/universityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Initialize app
const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
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
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check regex patterns for vercel and pages.dev domains
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const pagesPattern = /^https:\/\/.*\.pages\.dev$/;
    
    if (vercelPattern.test(origin) || pagesPattern.test(origin)) {
      return callback(null, true);
    }
    
    // If origin is not allowed, return error
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
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
app.use('/api/v2', enhancedCourseRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api', responseRoutes);
app.use('/api', scholarshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/uploads', uploadRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduSmart API',
    version: '2.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      blogs: '/api/blogs',
      courses: '/api/courses',
      enhancedCourses: '/api/v2/courses',
      caseStudies: '/api/case-studies',
      responses: '/api/responses',
      scholarships: '/api/scholarships',
      users: '/api/users',
      userProfile: '/api/user',
      universities: '/api/universities',
      uploads: '/api/uploads'
    }
  });
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