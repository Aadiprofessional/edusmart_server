const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const ADMIN_USER = {
  email: 'matrixai.global@gmail.com',
  password: 'SecurePassword123!'
};

let adminToken = null;

// Helper function
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

const runSimpleTest = async () => {
  console.log('🚀 Simple API Test...');
  
  // 1. Login as admin
  console.log('\n1. Admin Login...');
  const loginResult = await apiCall('POST', '/api/auth/login', ADMIN_USER);
  if (loginResult.success) {
    adminToken = loginResult.data.session?.access_token;
    console.log('✅ Admin logged in successfully');
    console.log('Role:', loginResult.data.user.role);
  } else {
    console.log('❌ Admin login failed:', loginResult.error);
    return;
  }

  // 2. Test blog creation
  console.log('\n2. Create Blog...');
  const blogData = {
    title: 'Test Blog Post',
    content: 'This is a test blog post content that is long enough to pass validation requirements. It contains meaningful information about testing.',
    excerpt: 'A test blog post for API testing',
    category: 'Test',
    tags: ['test', 'api'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
  };
  
  const createBlogResult = await apiCall('POST', '/api/blogs', blogData, adminToken);
  if (createBlogResult.success) {
    console.log('✅ Blog created successfully');
    console.log('Blog ID:', createBlogResult.data.blog.id);
  } else {
    console.log('❌ Blog creation failed:', createBlogResult.error);
  }

  // 3. Test scholarship creation
  console.log('\n3. Create Scholarship...');
  const scholarshipData = {
    title: 'Test Scholarship Program',
    description: 'This is a test scholarship program designed to validate the API functionality. It provides comprehensive support for students.',
    amount: 25000,
    eligibility: 'Test eligibility criteria',
    deadline: '2024-12-31',
    university: 'Test University',
    country: 'USA',
    application_link: 'https://test.edu/scholarship'
  };
  
  const createScholarshipResult = await apiCall('POST', '/api/scholarships', scholarshipData, adminToken);
  if (createScholarshipResult.success) {
    console.log('✅ Scholarship created successfully');
    console.log('Scholarship ID:', createScholarshipResult.data.scholarship.id);
  } else {
    console.log('❌ Scholarship creation failed:', createScholarshipResult.error);
  }

  // 4. Test public endpoints
  console.log('\n4. Test Public Endpoints...');
  
  const getBlogsResult = await apiCall('GET', '/api/blogs');
  if (getBlogsResult.success) {
    console.log('✅ Get blogs successful');
    console.log('Total blogs:', getBlogsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get blogs failed:', getBlogsResult.error);
  }

  const getScholarshipsResult = await apiCall('GET', '/api/scholarships');
  if (getScholarshipsResult.success) {
    console.log('✅ Get scholarships successful');
    console.log('Total scholarships:', getScholarshipsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get scholarships failed:', getScholarshipsResult.error);
  }

  console.log('\n🎉 Simple test completed!');
};

runSimpleTest().catch(console.error); 