// Lightweight API handler for Cloudflare Pages Functions
// This avoids Express.js and its heavy Node.js dependencies

// Import controllers directly
import { login, register, verifyToken } from '../../src/controllers/authController.js';
import { getUsers, getUserById, updateUser, deleteUser } from '../../src/controllers/userController.js';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } from '../../src/controllers/blogController.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../../src/controllers/courseController.js';

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
      } else if (path === '/auth/verify' && method === 'POST') {
        await verifyToken(req, res);
      }
      // User routes
      else if (path === '/users' && method === 'GET') {
        await getUsers(req, res);
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
      // Blog routes
      else if (path === '/blogs' && method === 'GET') {
        await getBlogs(req, res);
      } else if (path === '/blogs' && method === 'POST') {
        await createBlog(req, res);
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