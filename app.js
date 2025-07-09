const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

// Import routes in CommonJS format
const authRoutes = require('./src/routes/authRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const enhancedCourseRoutes = require('./src/routes/enhancedCourseRoutes');
const caseStudyRoutes = require('./src/routes/caseStudyRoutes');
const responseRoutes = require('./src/routes/responseRoutes');
const scholarshipRoutes = require('./src/routes/scholarshipRoutes');
const userRoutes = require('./src/routes/userRoutes');
const userProfileRoutes = require('./src/routes/userProfileRoutes');
const universityRoutes = require('./src/routes/universityRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const featuredRoutes = require('./src/routes/featuredRoutes');
const homeworkRoutes = require('./src/routes/homeworkRoutes');
const mistakeCheckRoutes = require('./src/routes/mistakeCheckRoutes');
const flashcardRoutes = require('./src/routes/flashcardRoutes');
const contentWriterRoutes = require('./src/routes/contentWriterRoutes');
const studyPlannerRoutes = require('./src/routes/studyPlannerRoutes');

// Initialize app
const app = express();

// CORS configuration for Alibaba Cloud
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      // Production frontend URLs
      'https://edusmart-admin.vercel.app',
      'https://edusmart-frontend.vercel.app',
      'https://edusmart.vercel.app',
      'https://edusmart-admin.pages.dev',
      'https://edusmart-9z4.pages.dev',
      // Add any other production domains
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin found in allowed list:', origin);
      return callback(null, true);
    }
    
    // Check for localhost with any port
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    if (localhostPattern.test(origin)) {
      console.log('✅ Origin matches localhost pattern:', origin);
      return callback(null, true);
    }
    
    // Check for vercel and pages.dev domains
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const pagesPattern = /^https:\/\/.*\.pages\.dev$/;
    
    if (vercelPattern.test(origin) || pagesPattern.test(origin)) {
      console.log('✅ Origin matches production pattern:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origin not allowed:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));

// Enhanced CORS for Alibaba Cloud
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers manually for better compatibility
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(helmet());

// Add logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduSmart API',
    version: '1.0.0',
    status: 'online',
    platform: 'Alibaba Cloud Function Compute',
    timestamp: new Date().toISOString(),
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
      uploads: '/api/uploads',
      subscriptions: '/api/subscriptions',
      featured: '/api/featured',
      homework: '/api/homework',
      mistakeChecks: '/api/mistake-checks',
      flashcards: '/api/flashcards',
      contentWriter: '/api/content-writer',
      studyPlanner: '/api/study-planner'
    }
  });
});

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
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', featuredRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/mistake-checks', mistakeCheckRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/content-writer', contentWriterRoutes);
app.use('/api/study-planner', studyPlannerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/blogs',
      '/api/courses',
      '/api/v2/courses',
      '/api/case-studies',
      '/api/responses',
      '/api/scholarships',
      '/api/users',
      '/api/user',
      '/api/universities',
      '/api/uploads',
      '/api/subscriptions',
      '/api/featured',
      '/api/homework',
      '/api/mistake-checks',
      '/api/flashcards',
      '/api/content-writer',
      '/api/study-planner'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server only if run directly (not in serverless)
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 EduSmart API Server running on port ${PORT}`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  });
}

module.exports = app; 