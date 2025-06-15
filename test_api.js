// Comprehensive API Testing Script for EduSmart Server
// Tests all endpoints deployed on Cloudflare Pages

const BASE_URL = 'https://edusmart-server.pages.dev/api';

// Test credentials (from previous conversation)
const TEST_CREDENTIALS = {
  email: 'matrixai.global@gmail.com',
  password: '12345678'
};

let authToken = null;
let testUserId = null;
let testBlogId = null;
let testCourseId = null;
let testApplicationId = null;

// Utility function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    console.log(`\n🔄 ${finalOptions.method || 'GET'} ${url}`);
    const response = await fetch(url, finalOptions);
    const data = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { raw: data };
    }

    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Status: ${response.status}`);
    
    if (response.ok) {
      console.log('📄 Response:', JSON.stringify(jsonData, null, 2));
    } else {
      console.log('❌ Error:', JSON.stringify(jsonData, null, 2));
    }
    
    return { success: response.ok, status: response.status, data: jsonData };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test Authentication Endpoints
async function testAuth() {
  console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS');
  console.log('=' .repeat(50));

  // Test Login
  console.log('\n🔑 Testing Login...');
  const loginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    })
  });

  if (loginResult.success && loginResult.data.session?.access_token) {
    authToken = loginResult.data.session.access_token;
    testUserId = loginResult.data.user?.id;
    console.log('🎉 Login successful! Token saved for subsequent requests.');
  }

  // Test Profile (requires auth)
  console.log('\n👤 Testing Get Profile...');
  await apiRequest('/auth/profile');

  // Test Refresh Token
  console.log('\n🔄 Testing Refresh Token...');
  await apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: loginResult.data.session?.refresh_token })
  });
}

// Test User Endpoints
async function testUsers() {
  console.log('\n👥 TESTING USER ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all users
  console.log('\n📋 Testing Get All Users...');
  await apiRequest('/users');

  // Get user by ID (if we have testUserId)
  if (testUserId) {
    console.log('\n👤 Testing Get User by ID...');
    await apiRequest(`/users/${testUserId}`);

    // Update user
    console.log('\n✏️ Testing Update User...');
    await apiRequest(`/users/${testUserId}`, {
      method: 'PUT',
      body: JSON.stringify({
        full_name: 'Updated Test User'
      })
    });
  }
}

// Test User Profile Endpoints
async function testUserProfile() {
  console.log('\n📝 TESTING USER PROFILE ENDPOINTS');
  console.log('=' .repeat(50));

  // Create/Update Profile
  console.log('\n📝 Testing Create/Update Profile...');
  await apiRequest('/user-profile', {
    method: 'POST',
    body: JSON.stringify({
      bio: 'Test user bio',
      phone: '+1234567890',
      location: 'Test City',
      education_level: 'Bachelor',
      field_of_study: 'Computer Science'
    })
  });

  // Get Profile
  console.log('\n👤 Testing Get Profile...');
  await apiRequest('/user-profile');

  // Update Profile Fields
  console.log('\n✏️ Testing Update Profile Fields...');
  await apiRequest('/user-profile', {
    method: 'PUT',
    body: JSON.stringify({
      bio: 'Updated test user bio'
    })
  });

  // Get Profile Completion
  console.log('\n📊 Testing Get Profile Completion...');
  await apiRequest('/user-profile/completion');
}

// Test Blog Endpoints
async function testBlogs() {
  console.log('\n📰 TESTING BLOG ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all blogs
  console.log('\n📋 Testing Get All Blogs...');
  const blogsResult = await apiRequest('/blogs');

  // Get blog categories
  console.log('\n🏷️ Testing Get Blog Categories...');
  await apiRequest('/blogs/categories');

  // Get blog tags
  console.log('\n🏷️ Testing Get Blog Tags...');
  await apiRequest('/blogs/tags');

  // Create a blog
  console.log('\n📝 Testing Create Blog...');
  const createBlogResult = await apiRequest('/blogs', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Blog Post',
      content: 'This is a test blog post content that is long enough to pass validation requirements.',
      excerpt: 'Test excerpt',
      category: 'Technology',
      tags: ['test', 'api'],
      status: 'published'
    })
  });

  if (createBlogResult.success && createBlogResult.data.data?.id) {
    testBlogId = createBlogResult.data.data.id;
    
    // Get blog by ID
    console.log('\n📄 Testing Get Blog by ID...');
    await apiRequest(`/blogs/${testBlogId}`);

    // Update blog
    console.log('\n✏️ Testing Update Blog...');
    await apiRequest(`/blogs/${testBlogId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Blog Post'
      })
    });
  }
}

// Test Course Endpoints
async function testCourses() {
  console.log('\n🎓 TESTING COURSE ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all courses
  console.log('\n📋 Testing Get All Courses...');
  await apiRequest('/courses');

  // Get course categories
  console.log('\n🏷️ Testing Get Course Categories...');
  await apiRequest('/courses/categories');

  // Get course levels
  console.log('\n📊 Testing Get Course Levels...');
  await apiRequest('/courses/levels');

  // Create a course
  console.log('\n📝 Testing Create Course...');
  const createCourseResult = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Course',
      description: 'This is a test course description.',
      category: 'Technology',
      level: 'Beginner',
      duration: '4 weeks',
      price: 99.99,
      instructor_name: 'Test Instructor',
      status: 'active'
    })
  });

  if (createCourseResult.success && createCourseResult.data.data?.id) {
    testCourseId = createCourseResult.data.data.id;
    
    // Get course by ID
    console.log('\n📄 Testing Get Course by ID...');
    await apiRequest(`/courses/${testCourseId}`);

    // Update course
    console.log('\n✏️ Testing Update Course...');
    await apiRequest(`/courses/${testCourseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Course'
      })
    });
  }
}

// Test University Endpoints
async function testUniversities() {
  console.log('\n🏫 TESTING UNIVERSITY ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all universities
  console.log('\n📋 Testing Get All Universities...');
  await apiRequest('/universities');

  // Get university countries
  console.log('\n🌍 Testing Get University Countries...');
  await apiRequest('/universities/countries');

  // Search universities
  console.log('\n🔍 Testing Search Universities...');
  await apiRequest('/universities/search?q=test');

  // Get universities by country
  console.log('\n🌍 Testing Get Universities by Country...');
  await apiRequest('/universities/by-country?country=USA');
}

// Test Scholarship Endpoints
async function testScholarships() {
  console.log('\n💰 TESTING SCHOLARSHIP ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all scholarships
  console.log('\n📋 Testing Get All Scholarships...');
  await apiRequest('/scholarships');

  // Get scholarship countries
  console.log('\n🌍 Testing Get Scholarship Countries...');
  await apiRequest('/scholarships/countries');

  // Get scholarship universities
  console.log('\n🏫 Testing Get Scholarship Universities...');
  await apiRequest('/scholarships/universities');
}

// Test Case Study Endpoints
async function testCaseStudies() {
  console.log('\n📚 TESTING CASE STUDY ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all case studies
  console.log('\n📋 Testing Get All Case Studies...');
  await apiRequest('/case-studies');

  // Get case study categories
  console.log('\n🏷️ Testing Get Case Study Categories...');
  await apiRequest('/case-studies/categories');

  // Get case study outcomes
  console.log('\n📊 Testing Get Case Study Outcomes...');
  await apiRequest('/case-studies/outcomes');

  // Get case study countries
  console.log('\n🌍 Testing Get Case Study Countries...');
  await apiRequest('/case-studies/countries');

  // Get case study fields
  console.log('\n🔬 Testing Get Case Study Fields...');
  await apiRequest('/case-studies/fields');
}

// Test Response Endpoints
async function testResponses() {
  console.log('\n💬 TESTING RESPONSE ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all responses
  console.log('\n📋 Testing Get All Responses...');
  await apiRequest('/responses');

  // Get response categories
  console.log('\n🏷️ Testing Get Response Categories...');
  await apiRequest('/responses/categories');

  // Get response types
  console.log('\n📊 Testing Get Response Types...');
  await apiRequest('/responses/types');
}

// Test Application Endpoints
async function testApplications() {
  console.log('\n📋 TESTING APPLICATION ENDPOINTS');
  console.log('=' .repeat(50));

  // Get all applications
  console.log('\n📋 Testing Get All Applications...');
  await apiRequest('/applications');

  // Create an application
  console.log('\n📝 Testing Create Application...');
  const createAppResult = await apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify({
      user_id: testUserId,
      type: 'scholarship',
      title: 'Test Application',
      status: 'pending'
    })
  });

  if (createAppResult.success && createAppResult.data.data?.id) {
    testApplicationId = createAppResult.data.data.id;
    
    // Get application by ID
    console.log('\n📄 Testing Get Application by ID...');
    await apiRequest(`/applications/${testApplicationId}`);

    // Update application
    console.log('\n✏️ Testing Update Application...');
    await apiRequest(`/applications/${testApplicationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'in_review'
      })
    });
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE API TESTING');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('📧 Test Email:', TEST_CREDENTIALS.email);
  console.log('=' .repeat(60));

  try {
    await testAuth();
    await testUsers();
    await testUserProfile();
    await testBlogs();
    await testCourses();
    await testUniversities();
    await testScholarships();
    await testCaseStudies();
    await testResponses();
    await testApplications();

    console.log('\n🎉 ALL TESTS COMPLETED!');
    console.log('=' .repeat(60));
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('✅ Authentication endpoints tested');
    console.log('✅ User management endpoints tested');
    console.log('✅ User profile endpoints tested');
    console.log('✅ Blog endpoints tested');
    console.log('✅ Course endpoints tested');
    console.log('✅ University endpoints tested');
    console.log('✅ Scholarship endpoints tested');
    console.log('✅ Case study endpoints tested');
    console.log('✅ Response endpoints tested');
    console.log('✅ Application endpoints tested');

  } catch (error) {
    console.error('\n💥 TEST RUNNER ERROR:', error);
  }
}

// Run the tests
runAllTests(); 