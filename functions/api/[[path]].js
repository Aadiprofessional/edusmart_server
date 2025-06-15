// Lightweight API handler for Cloudflare Pages Functions
// This avoids Express.js and its heavy Node.js dependencies

// Import all controllers
import { register, login, getProfile, logout, refreshToken } from '../../src/controllers/authController.js';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../../src/controllers/userController.js';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog, getBlogCategories, getBlogTags } from '../../src/controllers/blogController.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseCategories, getCourseLevels } from '../../src/controllers/courseController.js';
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
import applicationController from '../../src/controllers/applicationController.js';

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
      get: function(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    // Parse request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
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
      
      // User Profile routes
      else if (path === '/user-profile' && method === 'POST') {
        await createOrUpdateProfile(req, res);
      } else if (path === '/user-profile' && method === 'GET') {
        await getUserProfile(req, res);
      } else if (path === '/user-profile' && method === 'PUT') {
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
      
      // Course routes
      else if (path === '/courses' && method === 'GET') {
        await getCourses(req, res);
      } else if (path === '/courses' && method === 'POST') {
        await createCourse(req, res);
      } else if (path === '/courses/categories' && method === 'GET') {
        await getCourseCategories(req, res);
      } else if (path === '/courses/levels' && method === 'GET') {
        await getCourseLevels(req, res);
      } else if (path.startsWith('/courses/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await getCourseById(req, res);
      } else if (path.startsWith('/courses/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await updateCourse(req, res);
      } else if (path.startsWith('/courses/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await deleteCourse(req, res);
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
      } else if (path.startsWith('/applications/') && method === 'GET') {
        req.params.id = path.split('/')[2];
        await applicationController.getApplicationById(req, res);
      } else if (path.startsWith('/applications/') && method === 'PUT') {
        req.params.id = path.split('/')[2];
        await applicationController.updateApplication(req, res);
      } else if (path.startsWith('/applications/') && method === 'DELETE') {
        req.params.id = path.split('/')[2];
        await applicationController.deleteApplication(req, res);
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