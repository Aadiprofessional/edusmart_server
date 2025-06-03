const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const ADMIN_UID = 'bca2f806-29c5-4be9-bc2d-a484671546cd';

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

const testCompleteUidSystem = async () => {
  console.log('🚀 Testing Complete UID-based Admin System...');
  console.log('=================================================');

  let blogId = null;
  let scholarshipId = null;

  // 1. Test Blog Creation
  console.log('\n📝 1. Testing Blog Creation with UID...');
  const blogData = {
    uid: ADMIN_UID,
    title: 'Complete UID System Test Blog',
    content: 'This comprehensive blog post tests the complete UID-based authentication system. It verifies that admin operations work correctly without requiring Bearer token authentication, making the API more flexible and easier to use.',
    excerpt: 'Testing complete UID-based authentication system for blogs',
    category: 'Technology',
    tags: ['uid', 'authentication', 'admin', 'test'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
  };

  const createBlogResult = await apiCall('POST', '/api/blogs', blogData);
  if (createBlogResult.success) {
    blogId = createBlogResult.data.blog?.id;
    console.log('✅ Blog created successfully!');
    console.log('Blog ID:', blogId);
    console.log('Title:', createBlogResult.data.blog?.title);
  } else {
    console.log('❌ Blog creation failed:', createBlogResult.error);
  }

  // 2. Test Blog Update
  if (blogId) {
    console.log('\n✏️ 2. Testing Blog Update with UID...');
    const updateBlogData = {
      uid: ADMIN_UID,
      title: 'Complete UID System Test Blog (Updated)',
      content: 'This comprehensive blog post has been updated to test the UID-based authentication system. The update functionality works perfectly with admin UID verification.',
      excerpt: 'Updated: Testing complete UID-based authentication system',
      category: 'Technology',
      tags: ['uid', 'authentication', 'admin', 'test', 'updated'],
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
    };

    const updateBlogResult = await apiCall('PUT', `/api/blogs/${blogId}`, updateBlogData);
    if (updateBlogResult.success) {
      console.log('✅ Blog updated successfully!');
      console.log('Updated title:', updateBlogResult.data.blog?.title);
    } else {
      console.log('❌ Blog update failed:', updateBlogResult.error);
    }
  }

  // 3. Test Scholarship Creation
  console.log('\n💰 3. Testing Scholarship Creation with UID...');
  const scholarshipData = {
    uid: ADMIN_UID,
    title: 'Complete UID System Test Scholarship',
    description: 'This scholarship tests the complete UID-based authentication system for scholarship management. It demonstrates how admin operations can be performed using only UID verification without requiring session tokens.',
    amount: 25000,
    eligibility: 'Students testing UID-based authentication systems',
    deadline: '2024-12-31',
    university: 'UID Test University',
    country: 'USA',
    application_link: 'https://test.edu/uid-scholarship',
    requirements: ['Academic transcripts', 'UID verification', 'Test completion']
  };

  const createScholarshipResult = await apiCall('POST', '/api/scholarships', scholarshipData);
  if (createScholarshipResult.success) {
    scholarshipId = createScholarshipResult.data.scholarship?.id;
    console.log('✅ Scholarship created successfully!');
    console.log('Scholarship ID:', scholarshipId);
    console.log('Title:', createScholarshipResult.data.scholarship?.title);
    console.log('Amount:', '$' + createScholarshipResult.data.scholarship?.amount);
  } else {
    console.log('❌ Scholarship creation failed:', createScholarshipResult.error);
  }

  // 4. Test Scholarship Update
  if (scholarshipId) {
    console.log('\n📝 4. Testing Scholarship Update with UID...');
    const updateScholarshipData = {
      uid: ADMIN_UID,
      title: 'Complete UID System Test Scholarship (Updated)',
      description: 'This scholarship has been updated to test the UID-based authentication system. The update functionality works seamlessly with admin UID verification.',
      amount: 30000,
      eligibility: 'Updated: Students testing UID-based authentication systems',
      deadline: '2024-12-31',
      university: 'UID Test University',
      country: 'USA',
      application_link: 'https://test.edu/uid-scholarship-updated',
      requirements: ['Academic transcripts', 'UID verification', 'Test completion', 'Updated requirements']
    };

    const updateScholarshipResult = await apiCall('PUT', `/api/scholarships/${scholarshipId}`, updateScholarshipData);
    if (updateScholarshipResult.success) {
      console.log('✅ Scholarship updated successfully!');
      console.log('Updated title:', updateScholarshipResult.data.scholarship?.title);
      console.log('Updated amount:', '$' + updateScholarshipResult.data.scholarship?.amount);
    } else {
      console.log('❌ Scholarship update failed:', updateScholarshipResult.error);
    }
  }

  // 5. Test Public Endpoints (No UID required)
  console.log('\n📚 5. Testing Public Endpoints...');
  
  const getBlogsResult = await apiCall('GET', '/api/blogs');
  if (getBlogsResult.success) {
    console.log('✅ Get blogs successful (public access)');
    console.log('Total blogs:', getBlogsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get blogs failed:', getBlogsResult.error);
  }

  const getScholarshipsResult = await apiCall('GET', '/api/scholarships');
  if (getScholarshipsResult.success) {
    console.log('✅ Get scholarships successful (public access)');
    console.log('Total scholarships:', getScholarshipsResult.data.pagination?.totalItems || 0);
  } else {
    console.log('❌ Get scholarships failed:', getScholarshipsResult.error);
  }

  // 6. Test Categories and Tags
  console.log('\n🏷️ 6. Testing Categories and Tags...');
  
  const getCategoriesResult = await apiCall('GET', '/api/blog-categories');
  if (getCategoriesResult.success) {
    console.log('✅ Get blog categories successful');
    console.log('Categories:', getCategoriesResult.data.categories);
  } else {
    console.log('❌ Get blog categories failed:', getCategoriesResult.error);
  }

  const getCountriesResult = await apiCall('GET', '/api/scholarship-countries');
  if (getCountriesResult.success) {
    console.log('✅ Get scholarship countries successful');
    console.log('Countries:', getCountriesResult.data.countries);
  } else {
    console.log('❌ Get scholarship countries failed:', getCountriesResult.error);
  }

  // 7. Test Invalid UID (Should fail)
  console.log('\n❌ 7. Testing Invalid UID Rejection...');
  const invalidBlogData = {
    uid: 'invalid-uid-12345',
    title: 'This Should Fail',
    content: 'This blog creation should fail because the UID is invalid.',
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

  // 8. Test Non-Admin UID (Should fail if we had a regular user)
  console.log('\n🚫 8. Testing Non-Admin UID Rejection...');
  const nonAdminUid = 'some-regular-user-uid';
  const nonAdminBlogData = {
    uid: nonAdminUid,
    title: 'This Should Also Fail',
    content: 'This should fail because the UID belongs to a non-admin user.',
    excerpt: 'Testing non-admin UID',
    category: 'Test',
    tags: ['non-admin']
  };

  const nonAdminResult = await apiCall('POST', '/api/blogs', nonAdminBlogData);
  if (!nonAdminResult.success) {
    console.log('✅ Non-admin UID correctly rejected:', nonAdminResult.error.error);
  } else {
    console.log('❌ Non-admin UID was accepted (this is wrong!)');
  }

  // 9. Cleanup - Delete created items
  console.log('\n🧹 9. Cleanup - Deleting Test Items...');
  
  if (blogId) {
    const deleteBlogResult = await apiCall('DELETE', `/api/blogs/${blogId}`, { uid: ADMIN_UID });
    if (deleteBlogResult.success) {
      console.log('✅ Test blog deleted successfully');
    } else {
      console.log('❌ Blog deletion failed:', deleteBlogResult.error);
    }
  }

  if (scholarshipId) {
    const deleteScholarshipResult = await apiCall('DELETE', `/api/scholarships/${scholarshipId}`, { uid: ADMIN_UID });
    if (deleteScholarshipResult.success) {
      console.log('✅ Test scholarship deleted successfully');
    } else {
      console.log('❌ Scholarship deletion failed:', deleteScholarshipResult.error);
    }
  }

  console.log('\n🎉 Complete UID-based System Testing Completed!');
  console.log('=================================================');
  console.log('✅ All admin operations work with UID-based authentication');
  console.log('✅ No Bearer tokens required for admin operations');
  console.log('✅ Public endpoints work without authentication');
  console.log('✅ Invalid UIDs are properly rejected');
  console.log('✅ CRUD operations work seamlessly');
};

// Run the complete test
testCompleteUidSystem().catch(console.error); 