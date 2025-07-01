// Lightweight API handler for Cloudflare Pages Functions
// This avoids Express.js and its heavy Node.js dependencies

// Import all controllers
import { register, login, getProfile, logout, refreshToken } from '../../src/controllers/authController.js';
import { getAllUsers, getUserById, updateUser, deleteUser, getUserStats } from '../../src/controllers/userController.js';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog, getBlogCategories, getBlogTags } from '../../src/controllers/blogController.js';
import { 
  // Course management
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // Section management
  getCourseSections,
  createCourseSection,
  updateCourseSection,
  deleteCourseSection,
  
  // Lecture management
  createCourseLecture,
  updateCourseLecture,
  deleteCourseLecture,
  
  // Enrollment management
  enrollInCourse,
  getUserEnrollments,
  
  // Progress tracking
  updateLectureProgress,
  getCourseProgress,
  
  // Reviews
  createCourseReview,
  getCourseReviews,
  
  // Utilities
  getCourseCategories,
  getCourseLevels,
  getCourseStatistics,
  
  // AI Video Summary
  generateVideoSummary
} from '../../src/controllers/enhancedCourseController.js';
import { 
  getCaseStudies, 
  getCaseStudyById, 
  createCaseStudy, 
  updateCaseStudy, 
  deleteCaseStudy,
  getCaseStudyCategories,
  getCaseStudyOutcomes,
  getCaseStudyCountries,
  getCaseStudyFields
} from '../../src/controllers/caseStudyController.js';
import { 
  getScholarships, 
  getScholarshipById, 
  createScholarship, 
  updateScholarship, 
  deleteScholarship,
  getScholarshipCountries,
  getScholarshipUniversities
} from '../../src/controllers/scholarshipController.js';
import {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByCountry,
  searchUniversities,
  getUniversityCountries
} from '../../src/controllers/universityController.js';
import { 
  getResponses, 
  getResponseById, 
  createResponse, 
  updateResponse, 
  deleteResponse,
  getResponseCategories,
  getResponseTypes
} from '../../src/controllers/responseController.js';
import {
  createOrUpdateProfile,
  getUserProfile,
  updateProfileFields,
  deleteUserProfile,
  getProfileCompletion
} from '../../src/controllers/userProfileController.js';
import {
  getSubscriptionPlans,
  getAddonPlans,
  getUserSubscription,
  buySubscription,
  buyAddon,
  useResponse,
  getResponseHistory,
  getTransactionHistory,
  getUsageLogs,
  getAllSubscriptions,
  refreshResponses
} from '../../src/controllers/subscriptionController.js';
import {
  getAllFeaturedItems,
  getFeaturedItemsByType
} from '../../src/controllers/featuredController.js';
import {
  submitHomework,
  getHomeworkHistory,
  updateHomework,
  deleteHomework,
  getHomeworkById
} from '../../src/controllers/homeworkController.js';
import {
  submitMistakeCheck,
  getMistakeCheckHistory,
  updateMistakeCheck,
  deleteMistakeCheck,
  getMistakeCheckById
} from '../../src/controllers/mistakeCheckController.js';
import {
  getUserFlashcardSets,
  getFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard
} from '../../src/controllers/flashcardController.js';
import {
  saveContent,
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats
} from '../../src/controllers/contentWriterController.js';
import applicationController from '../../src/controllers/applicationController.js';
import {
  // Study Tasks
  getUserStudyTasks,
  getStudyTaskById,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask,
  
  // Applications
  getUserApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  
  // Application Tasks
  createApplicationTask,
  updateApplicationTask,
  deleteApplicationTask,
  
  // Reminders
  getUserReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  
  // Dashboard
  getDashboardStats
} from '../../src/controllers/studyPlannerController.js';

// Import auth middleware functions
import { supabase } from '../../src/utils/supabase.js';

// Authentication helper function
async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Import supabaseAdmin to use service role key for JWT verification
    const { supabaseAdmin } = await import('../../src/utils/supabase.js');
    const { data: { user }, error } = await supabaseAdmin().auth.getUser(token);
    
    if (error || !user) {
      return { success: false, error: 'Invalid token' };
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Token verification failed' };
  }
}

// Upload helper functions (since we can't use multer in Cloudflare Pages)
async function handleImageUpload(file, folder = 'images') {
  try {
    const { supabaseAdmin } = await import('../../src/utils/supabase.js');
    const { v4: uuidv4 } = await import('uuid');
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin().storage
      .from('university-images')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin().storage
      .from('university-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      path: filePath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add environment variables to a global object
  const envVars = {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: env.JWT_SECRET,
    NODE_ENV: 'production'
  };
  
  // Make environment variables available globally
  globalThis.process = { env: envVars };

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '') || '/';
    const method = request.method;
    
    // Create request object
    const req = {
      method,
      url: path + url.search,
      path,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body: null,
      params: {},
      user: null,
      userId: null,
      userEmail: null,
      userRole: null,
      get: function(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    // Parse request body for POST/PUT/PATCH/DELETE
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const body = await request.text();
      if (body) {
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = body;
        }
      }
    }

    // Create response object
    let responseData = null;
    let statusCode = 200;
    let responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const res = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = JSON.stringify(data);
        return this;
      },
      send: function(data) {
        if (typeof data === 'object') {
          responseData = JSON.stringify(data);
        } else {
          responseData = data;
        }
        return this;
      },
      header: function(name, value) {
        responseHeaders[name] = value;
        return this;
      },
      set: function(name, value) {
        responseHeaders[name] = value;
        return this;
      }
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: responseHeaders
      });
    }

    // Routes that require authentication
    const protectedRoutes = [
      '/auth/profile',
      '/user-profile',
      '/user/profile',
      '/subscriptions/status',
      '/subscriptions/buy',
      '/subscriptions/buy-addon',
      '/subscriptions/purchase',
      '/subscriptions/purchase-addon',
      '/subscriptions/use-response',
      '/subscriptions/responses',
      '/subscriptions/response-history',
      '/subscriptions/transactions',
      '/subscriptions/transaction-history',
      '/subscriptions/usage-logs',
      '/subscriptions/admin/all',
      '/subscriptions/all',
      '/subscriptions/admin/refresh-responses',
      '/subscriptions/refresh-responses',
      '/generate-video-summary',
      '/v2/generate-video-summary'
    ];

    // Blog routes use UID-based admin verification, not JWT authentication
    // Course routes also use UID-based admin verification for admin operations
    const uidBasedAdminRoutes = ['/blogs', '/courses', '/scholarships', '/universities', '/responses', '/case-studies', '/uploads'];
    
    const requiresAuth = protectedRoutes.some(route => {
      if (route === path) return true;
      if (path.startsWith(route + '/')) return true;
      return false;
    }) || path === '/auth/profile' || 
    // Course routes that require user authentication
    (path.match(/^\/courses\/[^\/]+\/enroll$/) && method === 'POST') ||
    (path.match(/^\/courses\/[^\/]+\/progress$/) && method === 'POST') ||
    (path.match(/^\/courses\/[^\/]+\/reviews$/) && method === 'POST') ||
    (path.match(/^\/v2\/courses\/[^\/]+\/enroll$/) && method === 'POST') ||
    (path.match(/^\/v2\/courses\/[^\/]+\/progress$/) && method === 'POST') ||
    (path.match(/^\/v2\/courses\/[^\/]+\/reviews$/) && method === 'POST') ||
    (path.match(/^\/users\/[^\/]+\/enrollments$/) && method === 'GET') ||
    (path.match(/^\/v2\/users\/[^\/]+\/enrollments$/) && method === 'GET');

    // Don't require JWT auth for UID-based admin routes
    const isUidBasedRoute = uidBasedAdminRoutes.some(route => {
      return path === route || path.startsWith(route + '/');
    });
    
    const needsJwtAuth = requiresAuth && !isUidBasedRoute;

    // Authenticate if required
    if (needsJwtAuth) {
      const authResult = await authenticateRequest(req);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: 401,
          headers: responseHeaders
        });
      }
      
      // Add user info to request
      req.user = authResult.user;
      req.userId = authResult.user.id;
      req.userEmail = authResult.user.email;
      req.userRole = 'user'; // Default role
    }

    // Route handling
    try {
      // Auth routes
      if (path === '/auth/login' && method === 'POST') {
        await login(req, res);
      } else if (path === '/auth/register' && method === 'POST') {
        await register(req, res);
      } else if (path === '/auth/profile' && method === 'GET') {
        await getProfile(req, res);
      } else if (path === '/auth/logout' && method === 'POST') {
        await logout(req, res);
      } else if (path === '/auth/refresh' && method === 'POST') {
        await refreshToken(req, res);
      }
      
      // User routes
      else if (path === '/users' && method === 'GET') {
        await getAllUsers(req, res);
      } else if (path === '/users/stats' && method === 'GET') {
        await getUserStats(req, res);
      } else if (path.startsWith('/users/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getUserById(req, res);
      } else if (path.startsWith('/users/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateUser(req, res);
      } else if (path.startsWith('/users/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteUser(req, res);
      }
      
      // User Profile routes (using /user prefix to match main app)
      else if (path === '/user/profile' && method === 'POST') {
        await createOrUpdateProfile(req, res);
      } else if (path === '/user/profile' && method === 'GET') {
        await getUserProfile(req, res);
      } else if (path === '/user/profile' && method === 'PUT') {
        await createOrUpdateProfile(req, res);
      } else if (path === '/user/profile' && method === 'PATCH') {
        await updateProfileFields(req, res);
      } else if (path === '/user/profile' && method === 'DELETE') {
        await deleteUserProfile(req, res);
      } else if (path === '/user/profile/completion' && method === 'GET') {
        await getProfileCompletion(req, res);
      }
      
      // Legacy user-profile routes (backward compatibility)
      else if (path === '/user-profile' && method === 'POST') {
        await createOrUpdateProfile(req, res);
      } else if (path === '/user-profile' && method === 'GET') {
        await getUserProfile(req, res);
      } else if (path === '/user-profile' && method === 'PUT') {
        await createOrUpdateProfile(req, res);
      } else if (path === '/user-profile' && method === 'PATCH') {
        await updateProfileFields(req, res);
      } else if (path === '/user-profile' && method === 'DELETE') {
        await deleteUserProfile(req, res);
      } else if (path === '/user-profile/completion' && method === 'GET') {
        await getProfileCompletion(req, res);
      }
      
      // Blog routes
      else if (path === '/blogs' && method === 'GET') {
        await getBlogs(req, res);
      } else if (path === '/blogs' && method === 'POST') {
        await createBlog(req, res);
      } else if (path === '/blog-categories' && method === 'GET') {
        await getBlogCategories(req, res);
      } else if (path === '/blog-tags' && method === 'GET') {
        await getBlogTags(req, res);
      } else if (path === '/blogs/categories' && method === 'GET') {
        await getBlogCategories(req, res);
      } else if (path === '/blogs/tags' && method === 'GET') {
        await getBlogTags(req, res);
      } else if (path.startsWith('/blogs/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getBlogById(req, res);
      } else if (path.startsWith('/blogs/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateBlog(req, res);
      } else if (path.startsWith('/blogs/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteBlog(req, res);
      }
      
      // Course routes (v1 - basic)
      else if (path === '/courses' && method === 'GET') {
        await getCourses(req, res);
      } else if (path === '/courses' && method === 'POST') {
        await createCourse(req, res);
      } else if (path === '/courses/categories' && method === 'GET') {
        await getCourseCategories(req, res);
      } else if (path === '/courses/levels' && method === 'GET') {
        await getCourseLevels(req, res);
      }
      
      // Enhanced Course routes (v2 API)
      else if (path === '/v2/courses' && method === 'GET') {
        await getCourses(req, res);
      } else if (path === '/v2/courses' && method === 'POST') {
        await createCourse(req, res);
      } else if (path === '/v2/course-categories' && method === 'GET') {
        await getCourseCategories(req, res);
      } else if (path === '/v2/courses/categories' && method === 'GET') {
        await getCourseCategories(req, res);
      } else if (path === '/v2/course-levels' && method === 'GET') {
        await getCourseLevels(req, res);
      } else if (path === '/v2/courses/levels' && method === 'GET') {
        await getCourseLevels(req, res);
      }
      
      // V2 Specific course routes (must come before generic /v2/courses/:id)
      else if (path.match(/^\/v2\/courses\/[^\/]+\/enroll$/) && method === 'POST') {
        req.params.courseId = path.split('/')[3];
        await enrollInCourse(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/sections$/) && method === 'GET') {
        req.params.courseId = path.split('/')[3];
        await getCourseSections(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/sections$/) && method === 'POST') {
        req.params.courseId = path.split('/')[3];
        await createCourseSection(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/reviews$/) && method === 'GET') {
        req.params.courseId = path.split('/')[3];
        await getCourseReviews(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/reviews$/) && method === 'POST') {
        req.params.courseId = path.split('/')[3];
        await createCourseReview(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/enrollment\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        req.params.courseId = pathParts[3];
        req.params.userId = pathParts[5];
        // Simple enrollment check endpoint
        const { supabaseAdmin } = await import('../../src/utils/supabase.js');
        try {
          const { data: enrollment, error } = await supabaseAdmin()
            .from('course_enrollments')
            .select('*')
            .eq('user_id', req.params.userId)
            .eq('course_id', req.params.courseId)
            .single();
          
          res.json({
            success: true,
            data: {
              enrolled: !!enrollment,
              enrollment: enrollment || null,
              error: error?.message || null
            }
          });
        } catch (error) {
          res.status(500).json({ error: 'Server error checking enrollment' });
        }
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/progress\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        req.params.courseId = pathParts[3];
        req.params.userId = pathParts[5];
        await getCourseProgress(req, res);
      } else if (path.match(/^\/v2\/courses\/[^\/]+\/progress$/) && method === 'POST') {
        req.params.courseId = path.split('/')[3];
        await updateLectureProgress(req, res);
      } else if (path.match(/^\/v2\/users\/[^\/]+\/enrollments$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await getUserEnrollments(req, res);
      } else if (path.match(/^\/v2\/sections\/[^\/]+$/) && method === 'PUT') {
        req.params.sectionId = path.split('/')[3];
        await updateCourseSection(req, res);
      } else if (path.match(/^\/v2\/sections\/[^\/]+$/) && method === 'DELETE') {
        req.params.sectionId = path.split('/')[3];
        await deleteCourseSection(req, res);
      } else if (path === '/v2/sections' && method === 'POST') {
        await createCourseSection(req, res);
      } else if (path.match(/^\/v2\/sections\/[^\/]+\/lectures$/) && method === 'POST') {
        req.params.sectionId = path.split('/')[3];
        await createCourseLecture(req, res);
      } else if (path === '/v2/lectures' && method === 'POST') {
        await createCourseLecture(req, res);
      } else if (path.match(/^\/v2\/lectures\/[^\/]+$/) && method === 'PUT') {
        req.params.lectureId = path.split('/')[3];
        await updateCourseLecture(req, res);
      } else if (path.match(/^\/v2\/lectures\/[^\/]+$/) && method === 'DELETE') {
        req.params.lectureId = path.split('/')[3];
        await deleteCourseLecture(req, res);
      } else if (path === '/v2/generate-video-summary' && method === 'POST') {
        await generateVideoSummary(req, res);
      } else if (path === '/v2/admin/course-statistics' && method === 'GET') {
        await getCourseStatistics(req, res);
      }
      
      // V2 Generic course routes (must come after specific routes)
      else if (path.startsWith('/v2/courses/') && method === 'GET') {
        req.params.id = path.split('/')[3];
        await getCourseById(req, res);
      } else if (path.startsWith('/v2/courses/') && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateCourse(req, res);
      } else if (path.startsWith('/v2/courses/') && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteCourse(req, res);
      }
      
      // Specific course routes (must come before generic /courses/:id)
      else if (path.match(/^\/courses\/[^\/]+\/enroll$/) && method === 'POST') {
        req.params.courseId = path.split('/')[2];
        await enrollInCourse(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/sections$/) && method === 'GET') {
        req.params.courseId = path.split('/')[2];
        await getCourseSections(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/sections$/) && method === 'POST') {
        req.params.courseId = path.split('/')[2];
        await createCourseSection(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/reviews$/) && method === 'GET') {
        req.params.courseId = path.split('/')[2];
        await getCourseReviews(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/reviews$/) && method === 'POST') {
        req.params.courseId = path.split('/')[2];
        await createCourseReview(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/enrollment\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        req.params.courseId = pathParts[2];
        req.params.userId = pathParts[4];
        // Simple enrollment check endpoint
        const { supabaseAdmin } = await import('../../src/utils/supabase.js');
        try {
          const { data: enrollment, error } = await supabaseAdmin()
            .from('course_enrollments')
            .select('*')
            .eq('user_id', req.params.userId)
            .eq('course_id', req.params.courseId)
            .single();
          
          res.json({
            success: true,
            data: {
              enrolled: !!enrollment,
              enrollment: enrollment || null,
              error: error?.message || null
            }
          });
        } catch (error) {
          res.status(500).json({ error: 'Server error checking enrollment' });
        }
      } else if (path.match(/^\/courses\/[^\/]+\/progress\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        req.params.courseId = pathParts[2];
        req.params.userId = pathParts[4];
        await getCourseProgress(req, res);
      } else if (path.match(/^\/courses\/[^\/]+\/progress$/) && method === 'POST') {
        req.params.courseId = path.split('/')[2];
        await updateLectureProgress(req, res);
      } else if (path.match(/^\/users\/[^\/]+\/enrollments$/) && method === 'GET') {
        req.params.userId = path.split('/')[2];
        await getUserEnrollments(req, res);
      } else if (path.match(/^\/sections\/[^\/]+$/) && method === 'PUT') {
        req.params.sectionId = path.split('/')[2];
        await updateCourseSection(req, res);
      } else if (path.match(/^\/sections\/[^\/]+$/) && method === 'DELETE') {
        req.params.sectionId = path.split('/')[2];
        await deleteCourseSection(req, res);
      } else if (path === '/sections' && method === 'POST') {
        // Handle direct section creation (admin panel expects this route)
        await createCourseSection(req, res);
      } else if (path.match(/^\/sections\/[^\/]+\/lectures$/) && method === 'POST') {
        req.params.sectionId = path.split('/')[2];
        await createCourseLecture(req, res);
      } else if (path === '/lectures' && method === 'POST') {
        // Handle direct lecture creation (admin panel expects this route)
        await createCourseLecture(req, res);
      } else if (path.match(/^\/lectures\/[^\/]+$/) && method === 'PUT') {
        req.params.lectureId = path.split('/')[2];
        await updateCourseLecture(req, res);
      } else if (path.match(/^\/lectures\/[^\/]+$/) && method === 'DELETE') {
        req.params.lectureId = path.split('/')[2];
        await deleteCourseLecture(req, res);
      } else if (path === '/generate-video-summary' && method === 'POST') {
        await generateVideoSummary(req, res);
      } else if (path === '/admin/course-statistics' && method === 'GET') {
        await getCourseStatistics(req, res);
      }
      
      // Generic course routes (must come after specific routes)
      else if (path.startsWith('/courses/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getCourseById(req, res);
      } else if (path.startsWith('/courses/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateCourse(req, res);
      } else if (path.startsWith('/courses/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteCourse(req, res);
      }
      
      // Upload routes
      else if (path === '/uploads/image' && method === 'POST') {
        // Handle image upload
        try {
          const formData = await request.formData();
          const file = formData.get('image');
          
          if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
          } else {
            const result = await handleImageUpload(file, 'images');
            if (result.success) {
              res.json(result);
            } else {
              res.status(500).json({ error: result.error });
            }
          }
        } catch (error) {
          res.status(500).json({ error: 'Failed to upload file' });
        }
      } else if (path === '/uploads/logo' && method === 'POST') {
        // Handle logo upload
        try {
          const formData = await request.formData();
          const file = formData.get('logo');
          
          if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
          } else {
            const result = await handleImageUpload(file, 'logos');
            if (result.success) {
              res.json(result);
            } else {
              res.status(500).json({ error: result.error });
            }
          }
        } catch (error) {
          res.status(500).json({ error: 'Failed to upload file' });
        }
      } else if (path === '/uploads/gallery' && method === 'POST') {
        // Handle gallery upload
        try {
          const formData = await request.formData();
          const files = formData.getAll('images');
          
          if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
          } else {
            const uploadPromises = files.map(file => handleImageUpload(file, 'gallery'));
            const results = await Promise.all(uploadPromises);
            
            const successfulUploads = results.filter(r => r.success);
            const failedUploads = results.filter(r => !r.success);
            
            if (successfulUploads.length > 0) {
              res.json({
                success: true,
                files: successfulUploads,
                failed: failedUploads
              });
            } else {
              res.status(500).json({ error: 'All uploads failed' });
            }
          }
        } catch (error) {
          res.status(500).json({ error: 'Failed to upload gallery images' });
        }
      } else if (path.match(/^\/uploads\/image\/(.+)$/) && method === 'DELETE') {
        // Handle image deletion
        try {
          const filePath = path.replace('/uploads/image/', '');
          const { supabaseAdmin } = await import('../../src/utils/supabase.js');
          
          const { error } = await supabaseAdmin().storage
            .from('university-images')
            .remove([filePath]);

          if (error) {
            res.status(500).json({ error: 'Failed to delete file' });
          } else {
            res.json({
              success: true,
              message: 'File deleted successfully'
            });
          }
        } catch (error) {
          res.status(500).json({ error: 'Failed to delete file' });
        }
      }
      
      // Case Study routes
      else if (path === '/case-studies' && method === 'GET') {
        await getCaseStudies(req, res);
      } else if (path === '/case-studies' && method === 'POST') {
        await createCaseStudy(req, res);
      } else if (path === '/case-studies/categories' && method === 'GET') {
        await getCaseStudyCategories(req, res);
      } else if (path === '/case-studies/outcomes' && method === 'GET') {
        await getCaseStudyOutcomes(req, res);
      } else if (path === '/case-studies/countries' && method === 'GET') {
        await getCaseStudyCountries(req, res);
      } else if (path === '/case-studies/fields' && method === 'GET') {
        await getCaseStudyFields(req, res);
      } else if (path.startsWith('/case-studies/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getCaseStudyById(req, res);
      } else if (path.startsWith('/case-studies/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateCaseStudy(req, res);
      } else if (path.startsWith('/case-studies/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteCaseStudy(req, res);
      }
      
      // Scholarship routes
      else if (path === '/scholarships' && method === 'GET') {
        await getScholarships(req, res);
      } else if (path === '/scholarships' && method === 'POST') {
        await createScholarship(req, res);
      } else if (path === '/scholarships/countries' && method === 'GET') {
        await getScholarshipCountries(req, res);
      } else if (path === '/scholarships/universities' && method === 'GET') {
        await getScholarshipUniversities(req, res);
      } else if (path.startsWith('/scholarships/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getScholarshipById(req, res);
      } else if (path.startsWith('/scholarships/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateScholarship(req, res);
      } else if (path.startsWith('/scholarships/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteScholarship(req, res);
      }
      
      // University routes
      else if (path === '/universities' && method === 'GET') {
        await getAllUniversities(req, res);
      } else if (path === '/universities' && method === 'POST') {
        await createUniversity(req, res);
      } else if (path === '/universities/search' && method === 'GET') {
        // Extract query from query parameters and set as path parameter
        req.params.query = req.query.query || 'university';
        await searchUniversities(req, res);
      } else if (path === '/universities/countries' && method === 'GET') {
        await getUniversityCountries(req, res);
      } else if (path === '/universities/by-country' && method === 'GET') {
        await getUniversitiesByCountry(req, res);
      } else if (path.startsWith('/universities/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getUniversityById(req, res);
      } else if (path.startsWith('/universities/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateUniversity(req, res);
      } else if (path.startsWith('/universities/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteUniversity(req, res);
      }
      
      // Response routes
      else if (path === '/responses' && method === 'GET') {
        await getResponses(req, res);
      } else if (path === '/responses' && method === 'POST') {
        await createResponse(req, res);
      } else if (path === '/responses/categories' && method === 'GET') {
        await getResponseCategories(req, res);
      } else if (path === '/responses/types' && method === 'GET') {
        await getResponseTypes(req, res);
      } else if (path.startsWith('/responses/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getResponseById(req, res);
      } else if (path.startsWith('/responses/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateResponse(req, res);
      } else if (path.startsWith('/responses/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteResponse(req, res);
      }
      
      // Application routes
      else if (path === '/applications' && method === 'GET') {
        await applicationController.getAllApplications(req, res);
      } else if (path === '/applications' && method === 'POST') {
        await applicationController.createApplication(req, res);
      } else if (path === '/applications/stats/overview' && method === 'GET') {
        await applicationController.getApplicationStats(req, res);
      } else if (path.match(/^\/applications\/user\/[^\/]+$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await applicationController.getApplicationsByUser(req, res);
      } else if (path.startsWith('/applications/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await applicationController.getApplicationById(req, res);
      } else if (path.startsWith('/applications/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await applicationController.updateApplication(req, res);
      } else if (path.startsWith('/applications/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await applicationController.deleteApplication(req, res);
      } else if (path.match(/^\/applications\/[^\/]+\/status$/) && method === 'PATCH') {
        req.params.id = path.split('/')[2];
        await applicationController.updateApplicationStatus(req, res);
      }
      
      // Subscription routes
      else if (path === '/subscriptions/plans' && method === 'GET') {
        await getSubscriptionPlans(req, res);
      } else if (path === '/subscriptions/addons' && method === 'GET') {
        await getAddonPlans(req, res);
      } else if (path === '/subscriptions/status' && method === 'GET') {
        await getUserSubscription(req, res);
      } else if (path === '/subscriptions/buy' && method === 'POST') {
        await buySubscription(req, res);
      } else if (path === '/subscriptions/buy-addon' && method === 'POST') {
        await buyAddon(req, res);
      } else if (path === '/subscriptions/purchase' && method === 'POST') {
        // Legacy route for backward compatibility
        await buySubscription(req, res);
      } else if (path === '/subscriptions/purchase-addon' && method === 'POST') {
        // Legacy route for backward compatibility
        await buyAddon(req, res);
      } else if (path === '/subscriptions/use-response' && method === 'POST') {
        await useResponse(req, res);
      } else if (path === '/subscriptions/responses' && method === 'GET') {
        await getResponseHistory(req, res);
      } else if (path === '/subscriptions/response-history' && method === 'GET') {
        // Legacy route for backward compatibility
        await getResponseHistory(req, res);
      } else if (path === '/subscriptions/transactions' && method === 'GET') {
        await getTransactionHistory(req, res);
      } else if (path === '/subscriptions/transaction-history' && method === 'GET') {
        // Legacy route for backward compatibility
        await getTransactionHistory(req, res);
      } else if (path === '/subscriptions/usage-logs' && method === 'GET') {
        await getUsageLogs(req, res);
      } else if (path === '/subscriptions/admin/all' && method === 'GET') {
        await getAllSubscriptions(req, res);
      } else if (path === '/subscriptions/all' && method === 'GET') {
        // Legacy route for backward compatibility
        await getAllSubscriptions(req, res);
      } else if (path === '/subscriptions/admin/refresh-responses' && method === 'POST') {
        await refreshResponses(req, res);
      } else if (path === '/subscriptions/refresh-responses' && method === 'POST') {
        // Legacy route for backward compatibility
        await refreshResponses(req, res);
      }
      
      // Featured routes
      else if (path === '/featured' && method === 'GET') {
        await getAllFeaturedItems(req, res);
      } else if (path.match(/^\/featured\/[^\/]+$/) && method === 'GET') {
        req.params.type = path.split('/')[2];
        await getFeaturedItemsByType(req, res);
      }
      
      // Homework routes
      else if (path === '/homework/submit' && method === 'POST') {
        const result = await submitHomework(req);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/homework\/history\/[^\/]+$/) && method === 'GET') {
        const uid = path.split('/')[3];
        const result = await getHomeworkHistory(uid, req.query);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/homework\/update\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[3];
        const result = await updateHomework(id, req.body);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/homework\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[2];
        const uid = req.query.uid;
        const result = await deleteHomework(id, uid);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/homework\/[^\/]+$/) && method === 'GET') {
        const id = path.split('/')[2];
        const uid = req.query.uid;
        const result = await getHomeworkById(id, uid);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      }
      
      // Mistake Check routes
      else if (path === '/mistake-checks/submit' && method === 'POST') {
        const result = await submitMistakeCheck(req);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/mistake-checks\/history\/[^\/]+$/) && method === 'GET') {
        const uid = path.split('/')[3];
        const result = await getMistakeCheckHistory(uid, req.query);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/mistake-checks\/update\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[3];
        const result = await updateMistakeCheck(id, req.body);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/mistake-checks\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[2];
        const uid = req.query.uid;
        const result = await deleteMistakeCheck(id, uid);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      } else if (path.match(/^\/mistake-checks\/[^\/]+$/) && method === 'GET') {
        const id = path.split('/')[2];
        const uid = req.query.uid;
        const result = await getMistakeCheckById(id, uid);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: responseHeaders
        });
      }
      
      // Flashcard routes
      else if (path === '/flashcards/sets' && method === 'GET') {
        await getUserFlashcardSets(req, res);
      } else if (path === '/flashcards/sets' && method === 'POST') {
        await createFlashcardSet(req, res);
      } else if (path.match(/^\/flashcards\/sets\/[^\/]+$/) && method === 'GET') {
        req.params.id = path.split('/')[3];
        await getFlashcardSetById(req, res);
      } else if (path.match(/^\/flashcards\/sets\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateFlashcardSet(req, res);
      } else if (path.match(/^\/flashcards\/sets\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteFlashcardSet(req, res);
      } else if (path.match(/^\/flashcards\/sets\/[^\/]+\/cards$/) && method === 'POST') {
        req.params.setId = path.split('/')[3];
        await addFlashcard(req, res);
      } else if (path.match(/^\/flashcards\/cards\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateFlashcard(req, res);
      } else if (path.match(/^\/flashcards\/cards\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteFlashcard(req, res);
      }
      
      // Content Writer routes
      else if (path === '/content-writer/save' && method === 'POST') {
        await saveContent(req, res);
      } else if (path.match(/^\/content-writer\/history\/[^\/]+$/) && method === 'GET') {
        req.params.uid = path.split('/')[3];
        await getContentHistory(req, res);
      } else if (path.match(/^\/content-writer\/stats\/[^\/]+$/) && method === 'GET') {
        req.params.uid = path.split('/')[3];
        await getContentStats(req, res);
      } else if (path.match(/^\/content-writer\/[^\/]+$/) && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getContentById(req, res);
      } else if (path.match(/^\/content-writer\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateContent(req, res);
      } else if (path.match(/^\/content-writer\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteContent(req, res);
      }
      
      // Root route
      else if (path === '/' && method === 'GET') {
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
            userProfile: '/api/user/profile',
            universities: '/api/universities',
            uploads: '/api/uploads',
            subscriptions: '/api/subscriptions',
            applications: '/api/applications',
            featured: '/api/featured',
            homework: '/api/homework',
            mistakeChecks: '/api/mistake-checks',
            flashcards: '/api/flashcards',
            contentWriter: '/api/content-writer',
            studyPlanner: '/api/study-planner'
          }
        });
      }
      
      // Study Planner routes
      else if (path.match(/^\/study-planner\/users\/[^\/]+\/study-tasks$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await getUserStudyTasks(req, res);
      } else if (path.match(/^\/study-planner\/study-tasks\/[^\/]+$/) && method === 'GET') {
        req.params.id = path.split('/')[3];
        await getStudyTaskById(req, res);
      } else if (path === '/study-planner/study-tasks' && method === 'POST') {
        await createStudyTask(req, res);
      } else if (path.match(/^\/study-planner\/study-tasks\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateStudyTask(req, res);
      } else if (path.match(/^\/study-planner\/study-tasks\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteStudyTask(req, res);
      }
      
      // Study Planner - Applications routes
      else if (path.match(/^\/study-planner\/users\/[^\/]+\/applications$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await getUserApplications(req, res);
      } else if (path.match(/^\/study-planner\/applications\/[^\/]+$/) && method === 'GET') {
        req.params.id = path.split('/')[3];
        await getApplicationById(req, res);
      } else if (path === '/study-planner/applications' && method === 'POST') {
        await createApplication(req, res);
      } else if (path.match(/^\/study-planner\/applications\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateApplication(req, res);
      } else if (path.match(/^\/study-planner\/applications\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteApplication(req, res);
      }
      
      // Study Planner - Application Tasks routes
      else if (path.match(/^\/study-planner\/applications\/[^\/]+\/tasks$/) && method === 'POST') {
        req.params.applicationId = path.split('/')[3];
        await createApplicationTask(req, res);
      } else if (path.match(/^\/study-planner\/application-tasks\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateApplicationTask(req, res);
      } else if (path.match(/^\/study-planner\/application-tasks\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteApplicationTask(req, res);
      }
      
      // Study Planner - Reminders routes
      else if (path.match(/^\/study-planner\/users\/[^\/]+\/reminders$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await getUserReminders(req, res);
      } else if (path === '/study-planner/reminders' && method === 'POST') {
        await createReminder(req, res);
      } else if (path.match(/^\/study-planner\/reminders\/[^\/]+$/) && method === 'PUT') {
        req.params.id = path.split('/')[3];
        await updateReminder(req, res);
      } else if (path.match(/^\/study-planner\/reminders\/[^\/]+$/) && method === 'DELETE') {
        req.params.id = path.split('/')[3];
        await deleteReminder(req, res);
      }
      
      // Study Planner - Dashboard routes
      else if (path.match(/^\/study-planner\/users\/[^\/]+\/dashboard\/stats$/) && method === 'GET') {
        req.params.userId = path.split('/')[3];
        await getDashboardStats(req, res);
      }
      
      // Default route
      else {
        res.status(404).json({ error: 'Route not found', path, method });
      }
    } catch (error) {
      console.error('Route handler error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message,
        path,
        method
      });
    }

    return new Response(responseData, {
      status: statusCode,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 