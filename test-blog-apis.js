import fetch from 'node-fetch';

// Configuration
const LOCALHOST_BASE_URL = 'http://localhost:8000/api';
const PRODUCTION_BASE_URL = 'https://edusmart-server.pages.dev/api';

// Test credentials
const TEST_EMAIL = 'matrixai.global@gmail.com';
const TEST_PASSWORD = '12345678';

// Global variables for authentication
let authToken = null;
let adminUid = null;

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    console.log(`\n🔄 Making request to: ${url}`);
    console.log(`Method: ${options.method || 'GET'}`);
    
    if (options.body) {
      console.log(`Body:`, JSON.stringify(JSON.parse(options.body), null, 2));
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = data;
    }
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : jsonData);
    
    return {
      status: response.status,
      data: jsonData,
      ok: response.ok
    };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return {
      status: 500,
      data: { error: error.message },
      ok: false
    };
  }
}

// Authentication function
async function authenticate(baseUrl) {
  console.log(`\n🔐 Authenticating with ${baseUrl}...`);
  
  const response = await makeRequest(`${baseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });
  
  if (response.ok && (response.data.token || response.data.session?.access_token)) {
    authToken = response.data.token || response.data.session.access_token;
    adminUid = response.data.user?.id;
    console.log(`✅ Authentication successful`);
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    console.log(`Admin UID: ${adminUid}`);
    return true;
  } else {
    console.log(`❌ Authentication failed`);
    return false;
  }
}

// Test functions for each blog API endpoint
async function testGetBlogs(baseUrl) {
  console.log(`\n📚 Testing GET /blogs`);
  
  // Test without parameters
  await makeRequest(`${baseUrl}/blogs`);
  
  // Test with pagination
  await makeRequest(`${baseUrl}/blogs?page=1&limit=5`);
  
  // Test with search
  await makeRequest(`${baseUrl}/blogs?search=test`);
  
  // Test with category filter
  await makeRequest(`${baseUrl}/blogs?category=technology`);
}

async function testGetBlogById(baseUrl, blogId = 'test-blog-id') {
  console.log(`\n📖 Testing GET /blogs/:id`);
  await makeRequest(`${baseUrl}/blogs/${blogId}`);
}

async function testGetBlogCategories(baseUrl) {
  console.log(`\n🏷️ Testing GET /blog-categories`);
  await makeRequest(`${baseUrl}/blog-categories`);
}

async function testGetBlogTags(baseUrl) {
  console.log(`\n🏷️ Testing GET /blog-tags`);
  await makeRequest(`${baseUrl}/blog-tags`);
}

async function testCreateBlog(baseUrl) {
  console.log(`\n✏️ Testing POST /blogs (Create Blog)`);
  
  if (!authToken || !adminUid) {
    console.log(`❌ No auth token or admin UID available`);
    return null;
  }
  
  const blogData = {
    uid: adminUid,
    title: "Test Blog Post",
    content: "This is a test blog post content with detailed information about testing APIs.",
    excerpt: "A test blog post for API testing",
    category: "Technology",
    tags: ["test", "api", "blog"],
    image: "https://example.com/test-image.jpg"
  };
  
  const response = await makeRequest(`${baseUrl}/blogs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(blogData)
  });
  
  if (response.ok && response.data.blog) {
    console.log(`✅ Blog created successfully with ID: ${response.data.blog.id}`);
    return response.data.blog.id;
  }
  
  return null;
}

async function testUpdateBlog(baseUrl, blogId) {
  console.log(`\n✏️ Testing PUT /blogs/:id (Update Blog)`);
  
  if (!authToken || !adminUid || !blogId) {
    console.log(`❌ Missing auth token, admin UID, or blog ID`);
    return;
  }
  
  const updateData = {
    uid: adminUid,
    title: "Updated Test Blog Post",
    content: "This is updated content for the test blog post.",
    excerpt: "Updated excerpt for the test blog",
    category: "Updated Technology",
    tags: ["updated", "test", "api"],
    image: "https://example.com/updated-image.jpg"
  };
  
  await makeRequest(`${baseUrl}/blogs/${blogId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updateData)
  });
}

async function testDeleteBlog(baseUrl, blogId) {
  console.log(`\n🗑️ Testing DELETE /blogs/:id (Delete Blog)`);
  
  if (!authToken || !adminUid || !blogId) {
    console.log(`❌ Missing auth token, admin UID, or blog ID`);
    return;
  }
  
  await makeRequest(`${baseUrl}/blogs/${blogId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      uid: adminUid
    })
  });
}

// Main test function
async function runBlogAPITests(baseUrl, environment) {
  console.log(`\n🚀 Starting Blog API Tests for ${environment}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`=`.repeat(60));
  
  // Step 1: Authenticate
  const authSuccess = await authenticate(baseUrl);
  if (!authSuccess) {
    console.log(`❌ Cannot proceed without authentication`);
    return;
  }
  
  // Step 2: Test public endpoints
  await testGetBlogs(baseUrl);
  await testGetBlogCategories(baseUrl);
  await testGetBlogTags(baseUrl);
  
  // Step 3: Test specific blog (this might fail if blog doesn't exist)
  await testGetBlogById(baseUrl);
  
  // Step 4: Test admin endpoints (create, update, delete)
  const createdBlogId = await testCreateBlog(baseUrl);
  
  if (createdBlogId) {
    // Test getting the created blog
    await testGetBlogById(baseUrl, createdBlogId);
    
    // Test updating the blog
    await testUpdateBlog(baseUrl, createdBlogId);
    
    // Test getting the updated blog
    await testGetBlogById(baseUrl, createdBlogId);
    
    // Test deleting the blog
    await testDeleteBlog(baseUrl, createdBlogId);
    
    // Verify blog is deleted
    await testGetBlogById(baseUrl, createdBlogId);
  }
  
  console.log(`\n✅ Completed Blog API Tests for ${environment}`);
  console.log(`=`.repeat(60));
}

// Run tests
async function main() {
  console.log(`🧪 Blog API Testing Suite`);
  console.log(`Testing with credentials: ${TEST_EMAIL}`);
  
  // Test localhost first
  console.log(`\n📍 Testing LOCALHOST environment`);
  await runBlogAPITests(LOCALHOST_BASE_URL, 'LOCALHOST');
  
  // Reset auth for production
  authToken = null;
  adminUid = null;
  
  // Test production
  console.log(`\n📍 Testing PRODUCTION environment`);
  await runBlogAPITests(PRODUCTION_BASE_URL, 'PRODUCTION');
  
  console.log(`\n🎉 All tests completed!`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
main().catch(console.error); 