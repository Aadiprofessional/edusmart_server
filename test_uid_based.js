const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Get the admin UID (you'll need to get this from your database)
// For matrixai.global@gmail.com user
const ADMIN_UID = 'bca2f806-29c5-4be9-bc2d-a484671546cd'; // Actual UID from database

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${endpoint}`);
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

const testUidBasedApis = async () => {
  console.log('🚀 Testing UID-based Admin APIs...');
  console.log('=====================================');

  // 1. Test blog creation with UID
  console.log('\n📝 Testing Create Blog with UID...');
  const blogData = {
    uid: ADMIN_UID,
    title: 'UID-Based Blog Creation Test',
    content: 'This blog post is created using UID-based authentication instead of Bearer tokens. This approach allows admin operations without requiring login sessions.',
    excerpt: 'Testing UID-based blog creation without authentication tokens',
    category: 'Test',
    tags: ['uid', 'test', 'admin'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
  };

  const createBlogResult = await apiCall('POST', '/api/blogs', blogData);
  if (createBlogResult.success) {
    console.log('✅ Blog created successfully with UID!');
    console.log('Blog ID:', createBlogResult.data.blog?.id);
  } else {
    console.log('❌ Blog creation failed:', createBlogResult.error);
  }

  // 2. Test scholarship creation with UID
  console.log('\n💰 Testing Create Scholarship with UID...');
  const scholarshipData = {
    uid: ADMIN_UID,
    title: 'UID-Based Scholarship Test',
    description: 'This scholarship is created using UID-based authentication system. It demonstrates how admin operations can work without requiring Bearer token authentication.',
    amount: 15000,
    eligibility: 'Students testing UID-based authentication',
    deadline: '2024-12-31',
    university: 'Test University',
    country: 'USA',
    application_link: 'https://test.edu/uid-scholarship'
  };

  const createScholarshipResult = await apiCall('POST', '/api/scholarships', scholarshipData);
  if (createScholarshipResult.success) {
    console.log('✅ Scholarship created successfully with UID!');
    console.log('Scholarship ID:', createScholarshipResult.data.scholarship?.id);
  } else {
    console.log('❌ Scholarship creation failed:', createScholarshipResult.error);
  }

  // 3. Test public endpoints (should work without UID)
  console.log('\n📚 Testing Public Endpoints...');
  
  const getBlogsResult = await apiCall('GET', '/api/blogs');
  if (getBlogsResult.success) {
    console.log('✅ Get blogs successful (public)');
    console.log('Total blogs:', getBlogsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get blogs failed:', getBlogsResult.error);
  }

  const getScholarshipsResult = await apiCall('GET', '/api/scholarships');
  if (getScholarshipsResult.success) {
    console.log('✅ Get scholarships successful (public)');
    console.log('Total scholarships:', getScholarshipsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get scholarships failed:', getScholarshipsResult.error);
  }

  // 4. Test with invalid UID (should fail)
  console.log('\n❌ Testing with Invalid UID...');
  const invalidBlogData = {
    uid: 'invalid-uid-123',
    title: 'This Should Fail',
    content: 'This blog creation should fail because the UID is invalid or not an admin.',
    excerpt: 'Testing invalid UID',
    category: 'Test',
    tags: ['invalid']
  };

  const invalidResult = await apiCall('POST', '/api/blogs', invalidBlogData);
  if (!invalidResult.success) {
    console.log('✅ Invalid UID correctly rejected:', invalidResult.error.error);
  } else {
    console.log('❌ Invalid UID was accepted (this is wrong!)');
  }

  console.log('\n🎉 UID-based API testing completed!');
  console.log('=====================================');
};

// Instructions for getting the admin UID
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. First, run the fix_blog_relationship.sql in your Supabase SQL Editor');
console.log('2. Get the admin UID by running this query in Supabase:');
console.log('   SELECT id FROM public.profiles WHERE email = \'matrixai.global@gmail.com\';');
console.log('3. Replace ADMIN_UID in this script with the actual UID');
console.log('4. Run this test script\n');

// Run the tests
testUidBasedApis().catch(console.error); 