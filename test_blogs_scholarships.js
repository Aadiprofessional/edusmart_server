const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const ADMIN_USER = {
  email: 'matrixai.global@gmail.com',
  password: 'SecurePassword123!'
};

let adminToken = null;

// Helper function to make API calls
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

    console.log(`Making ${method} request to ${endpoint}${token ? ' (with admin token)' : ' (no token)'}`);
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

// Login as admin
const loginAdmin = async () => {
  console.log('\n🔑 Logging in as Admin...');
  const result = await apiCall('POST', '/api/auth/login', ADMIN_USER);
  
  if (result.success) {
    console.log('✅ Admin login successful!');
    console.log('Admin:', result.data.user.name);
    console.log('Role:', result.data.user.role);
    
    if (result.data.session?.access_token) {
      adminToken = result.data.session.access_token;
      console.log('Admin token received:', adminToken ? 'Yes' : 'No');
    }
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
};

// ==================== BLOG TESTS ====================

const testGetBlogs = async () => {
  console.log('\n📚 Testing Get All Blogs (Public)...');
  const result = await apiCall('GET', '/api/blogs');
  
  if (result.success) {
    console.log('✅ Get blogs successful!');
    console.log('Total blogs:', result.data.pagination?.totalItems || 0);
    return true;
  } else {
    console.log('❌ Get blogs failed:', result.error);
    return false;
  }
};

const testCreateBlog = async () => {
  console.log('\n📝 Testing Create Blog (Admin Only)...');
  const blogData = {
    title: 'The Future of AI in Education: Transforming Learning Experiences',
    content: `Artificial Intelligence is revolutionizing the educational landscape in unprecedented ways. From personalized learning paths to intelligent tutoring systems, AI is making education more accessible, efficient, and effective than ever before.

    In this comprehensive guide, we explore how AI technologies are being integrated into educational institutions worldwide. We'll discuss the benefits of adaptive learning platforms, automated assessment tools, and predictive analytics that help educators identify at-risk students early.

    The integration of AI in education is not just about technology—it's about creating more inclusive and personalized learning environments that cater to diverse learning styles and needs. As we move forward, the collaboration between educators and AI systems will define the future of education.`,
    excerpt: 'Discover how AI is transforming education through personalized learning, intelligent tutoring, and predictive analytics.',
    category: 'Technology',
    tags: ['AI', 'Education', 'Technology', 'Innovation', 'Learning'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
  };

  const result = await apiCall('POST', '/api/blogs', blogData, adminToken);
  
  if (result.success) {
    console.log('✅ Blog created successfully!');
    console.log('Blog ID:', result.data.blog?.id);
    console.log('Title:', result.data.blog?.title);
    return result.data.blog?.id;
  } else {
    console.log('❌ Blog creation failed:', result.error);
    return null;
  }
};

const testGetBlogById = async (blogId) => {
  if (!blogId) return false;
  
  console.log('\n📖 Testing Get Blog by ID (Public)...');
  const result = await apiCall('GET', `/api/blogs/${blogId}`);
  
  if (result.success) {
    console.log('✅ Get blog by ID successful!');
    console.log('Title:', result.data.blog?.title);
    console.log('Author:', result.data.blog?.author?.name);
    return true;
  } else {
    console.log('❌ Get blog by ID failed:', result.error);
    return false;
  }
};

const testUpdateBlog = async (blogId) => {
  if (!blogId) return false;
  
  console.log('\n✏️ Testing Update Blog (Admin Only)...');
  const updateData = {
    title: 'The Future of AI in Education: Transforming Learning Experiences (Updated)',
    content: `Artificial Intelligence is revolutionizing the educational landscape in unprecedented ways. This updated version includes the latest trends and developments in AI education technology.

    From personalized learning paths to intelligent tutoring systems, AI is making education more accessible, efficient, and effective than ever before. Recent advances in natural language processing and machine learning have opened new possibilities for educational applications.

    The integration of AI in education is not just about technology—it's about creating more inclusive and personalized learning environments that cater to diverse learning styles and needs.`,
    excerpt: 'Updated: Discover the latest AI trends transforming education through personalized learning and intelligent systems.',
    category: 'Technology',
    tags: ['AI', 'Education', 'Technology', 'Innovation', 'Learning', 'Updated'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
  };

  const result = await apiCall('PUT', `/api/blogs/${blogId}`, updateData, adminToken);
  
  if (result.success) {
    console.log('✅ Blog updated successfully!');
    console.log('Updated title:', result.data.blog?.title);
    return true;
  } else {
    console.log('❌ Blog update failed:', result.error);
    return false;
  }
};

const testGetBlogCategories = async () => {
  console.log('\n📂 Testing Get Blog Categories (Public)...');
  const result = await apiCall('GET', '/api/blog-categories');
  
  if (result.success) {
    console.log('✅ Get blog categories successful!');
    console.log('Categories:', result.data.categories);
    return true;
  } else {
    console.log('❌ Get blog categories failed:', result.error);
    return false;
  }
};

// ==================== SCHOLARSHIP TESTS ====================

const testGetScholarships = async () => {
  console.log('\n🎓 Testing Get All Scholarships (Public)...');
  const result = await apiCall('GET', '/api/scholarships');
  
  if (result.success) {
    console.log('✅ Get scholarships successful!');
    console.log('Total scholarships:', result.data.pagination?.totalItems || 0);
    return true;
  } else {
    console.log('❌ Get scholarships failed:', result.error);
    return false;
  }
};

const testCreateScholarship = async () => {
  console.log('\n💰 Testing Create Scholarship (Admin Only)...');
  const scholarshipData = {
    title: 'Global Excellence Scholarship for AI Research',
    description: `The Global Excellence Scholarship is designed to support outstanding students pursuing advanced research in Artificial Intelligence and Machine Learning. This prestigious scholarship provides comprehensive financial support for graduate and doctoral students who demonstrate exceptional academic merit and research potential.

    Recipients will have access to state-of-the-art research facilities, mentorship from leading AI researchers, and opportunities to collaborate on cutting-edge projects. The scholarship covers tuition fees, living expenses, and research costs for the duration of the program.

    We are looking for passionate individuals who are committed to advancing the field of AI and making meaningful contributions to society through their research.`,
    amount: 50000.00,
    eligibility: 'Graduate or PhD students in Computer Science, AI, or related fields with GPA 3.5+',
    deadline: '2024-12-31',
    university: 'Stanford University',
    country: 'USA',
    application_link: 'https://stanford.edu/scholarships/ai-excellence',
    requirements: ['Academic transcripts', 'Research proposal', 'Letters of recommendation', 'Personal statement']
  };

  const result = await apiCall('POST', '/api/scholarships', scholarshipData, adminToken);
  
  if (result.success) {
    console.log('✅ Scholarship created successfully!');
    console.log('Scholarship ID:', result.data.scholarship?.id);
    console.log('Title:', result.data.scholarship?.title);
    console.log('Amount:', '$' + result.data.scholarship?.amount);
    return result.data.scholarship?.id;
  } else {
    console.log('❌ Scholarship creation failed:', result.error);
    return null;
  }
};

const testGetScholarshipById = async (scholarshipId) => {
  if (!scholarshipId) return false;
  
  console.log('\n🔍 Testing Get Scholarship by ID (Public)...');
  const result = await apiCall('GET', `/api/scholarships/${scholarshipId}`);
  
  if (result.success) {
    console.log('✅ Get scholarship by ID successful!');
    console.log('Title:', result.data.scholarship?.title);
    console.log('University:', result.data.scholarship?.university);
    console.log('Amount:', '$' + result.data.scholarship?.amount);
    return true;
  } else {
    console.log('❌ Get scholarship by ID failed:', result.error);
    return false;
  }
};

const testUpdateScholarship = async (scholarshipId) => {
  if (!scholarshipId) return false;
  
  console.log('\n📝 Testing Update Scholarship (Admin Only)...');
  const updateData = {
    title: 'Global Excellence Scholarship for AI Research (Updated)',
    description: `The Global Excellence Scholarship has been updated with enhanced benefits and expanded eligibility criteria. This prestigious scholarship now includes additional research funding and international collaboration opportunities.

    Recipients will have access to state-of-the-art research facilities, mentorship from leading AI researchers, and opportunities to collaborate on cutting-edge projects with partner institutions worldwide.`,
    amount: 60000.00,
    eligibility: 'Graduate or PhD students in Computer Science, AI, or related fields with GPA 3.3+',
    deadline: '2024-12-31',
    university: 'Stanford University',
    country: 'USA',
    application_link: 'https://stanford.edu/scholarships/ai-excellence-updated',
    requirements: ['Academic transcripts', 'Research proposal', 'Letters of recommendation', 'Personal statement', 'Portfolio']
  };

  const result = await apiCall('PUT', `/api/scholarships/${scholarshipId}`, updateData, adminToken);
  
  if (result.success) {
    console.log('✅ Scholarship updated successfully!');
    console.log('Updated title:', result.data.scholarship?.title);
    console.log('Updated amount:', '$' + result.data.scholarship?.amount);
    return true;
  } else {
    console.log('❌ Scholarship update failed:', result.error);
    return false;
  }
};

const testGetScholarshipCountries = async () => {
  console.log('\n🌍 Testing Get Scholarship Countries (Public)...');
  const result = await apiCall('GET', '/api/scholarship-countries');
  
  if (result.success) {
    console.log('✅ Get scholarship countries successful!');
    console.log('Countries:', result.data.countries);
    return true;
  } else {
    console.log('❌ Get scholarship countries failed:', result.error);
    return false;
  }
};

// Test cleanup functions
const testDeleteBlog = async (blogId) => {
  if (!blogId) return false;
  
  console.log('\n🗑️ Testing Delete Blog (Admin Only)...');
  const result = await apiCall('DELETE', `/api/blogs/${blogId}`, null, adminToken);
  
  if (result.success) {
    console.log('✅ Blog deleted successfully!');
    return true;
  } else {
    console.log('❌ Blog deletion failed:', result.error);
    return false;
  }
};

const testDeleteScholarship = async (scholarshipId) => {
  if (!scholarshipId) return false;
  
  console.log('\n🗑️ Testing Delete Scholarship (Admin Only)...');
  const result = await apiCall('DELETE', `/api/scholarships/${scholarshipId}`, null, adminToken);
  
  if (result.success) {
    console.log('✅ Scholarship deleted successfully!');
    return true;
  } else {
    console.log('❌ Scholarship deletion failed:', result.error);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting EduSmart Blog & Scholarship API Tests...');
  console.log('=====================================================');

  // Login as admin first
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ Admin login failed. Cannot proceed with admin tests.');
    return;
  }

  console.log('\n📚 ========== BLOG API TESTS ==========');
  
  // Test public blog endpoints
  await testGetBlogs();
  await testGetBlogCategories();
  
  // Test admin blog endpoints
  const blogId = await testCreateBlog();
  await testGetBlogById(blogId);
  await testUpdateBlog(blogId);
  
  console.log('\n🎓 ========== SCHOLARSHIP API TESTS ==========');
  
  // Test public scholarship endpoints
  await testGetScholarships();
  await testGetScholarshipCountries();
  
  // Test admin scholarship endpoints
  const scholarshipId = await testCreateScholarship();
  await testGetScholarshipById(scholarshipId);
  await testUpdateScholarship(scholarshipId);
  
  console.log('\n🧹 ========== CLEANUP TESTS ==========');
  
  // Cleanup - delete created items
  await testDeleteBlog(blogId);
  await testDeleteScholarship(scholarshipId);

  console.log('\n🎉 All Blog & Scholarship API tests completed!');
  console.log('=====================================================');
};

// Run tests
runAllTests().catch(console.error); 