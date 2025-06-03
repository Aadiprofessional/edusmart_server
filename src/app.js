const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const courseRoutes = require('./routes/courseRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const universityRoutes = require('./routes/universityRoutes');

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
    // 'https://your-frontend-domain.vercel.app',
    // 'https://your-frontend-domain.netlify.app',
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
app.use('/api', scholarshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/universities', universityRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduSmart API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      blogs: '/api/blogs',
      courses: '/api/courses',
      scholarships: '/api/scholarships',
      users: '/api/users',
      userProfile: '/api/user',
      applications: '/api/applications',
      universities: '/api/universities'
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