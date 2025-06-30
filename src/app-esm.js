import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Import routes (you'll need to convert these to ES modules too)
import authRoutes from './routes/authRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enhancedCourseRoutes from './routes/enhancedCourseRoutes.js';
import caseStudyRoutes from './routes/caseStudyRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import scholarshipRoutes from './routes/scholarshipRoutes.js';
import userRoutes from './routes/userRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import featuredRoutes from './routes/featuredRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';

// Initialize app
const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Log the origin for debugging
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
      // Add your production frontend URLs here
      'https://edusmart-admin.vercel.app',
      'https://edusmart-frontend.vercel.app',
      'https://edusmart.vercel.app',
      'https://edusmart-admin.pages.dev',
      'https://edusmart-9z4.pages.dev',
      // Add Cloudflare Pages domains
      'https://edusmart-api.pages.dev',
      'https://your-project-name.pages.dev',
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin found in allowed list:', origin);
      return callback(null, true);
    }
    
    // Check for localhost with any port (more flexible for development)
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    if (localhostPattern.test(origin)) {
      console.log('✅ Origin matches localhost pattern:', origin);
      return callback(null, true);
    }
    
    // Check regex patterns for vercel and pages.dev domains
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const pagesPattern = /^https:\/\/.*\.pages\.dev$/;
    
    if (vercelPattern.test(origin) || pagesPattern.test(origin)) {
      console.log('✅ Origin matches production pattern:', origin);
      return callback(null, true);
    }
    
    // If origin is not allowed, return error
    console.log('❌ Origin not allowed:', origin);
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
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false // Pass control to next handler
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Additional CORS headers middleware for extra safety
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers manually as backup
  if (origin) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'https://edusmart-admin.vercel.app',
      'https://edusmart-frontend.vercel.app',
      'https://edusmart.vercel.app',
      'https://edusmart-admin.pages.dev',
      'https://edusmart-9z4.pages.dev',
      'https://edusmart-api.pages.dev',
      'https://your-project-name.pages.dev',
    ];
    
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const pagesPattern = /^https:\/\/.*\.pages\.dev$/;
    
    if (allowedOrigins.includes(origin) || 
        localhostPattern.test(origin) || 
        vercelPattern.test(origin) || 
        pagesPattern.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    }
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

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
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', featuredRoutes);
app.use('/api/homework', homeworkRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduSmart API',
    version: '2.0.0',
    status: 'online',
    platform: 'Cloudflare Pages',
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
      homework: '/api/homework'
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

// Start server (only when running directly, not when imported)
const PORT = process.env.PORT || 8000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 EduSmart API Server running on port ${PORT}`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  });
}

// Export the app for use in Cloudflare Pages Functions
export default app; 