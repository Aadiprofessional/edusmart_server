const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'matrixai.global@gmail.com',
  password: 'SecurePassword123!',
  name: 'Matrix AI Global'
};

let userToken = null;

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

    console.log(`Making ${method} request to ${endpoint}${token ? ' (with token)' : ' (no token)'}`);
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

// Test functions
const testRegistration = async () => {
  console.log('\n🔐 Testing User Registration...');
  const result = await apiCall('POST', '/api/auth/register', TEST_USER);
  
  if (result.success) {
    console.log('✅ Registration successful!');
    console.log('User ID:', result.data.user.id);
    console.log('Email confirmed:', result.data.user.email_confirmed);
    console.log('Profile created:', result.data.user.profile_created);
    
    if (result.data.session?.access_token) {
      userToken = result.data.session.access_token;
      console.log('Token received:', userToken ? 'Yes' : 'No');
      return true;
    } else {
      console.log('⚠️ No session token received (email confirmation may be required)');
      return false; // Return false to trigger login attempt
    }
  } else {
    console.log('❌ Registration failed:', result.error);
    return false;
  }
};

const testLogin = async () => {
  console.log('\n🔑 Testing User Login...');
  const result = await apiCall('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    console.log('✅ Login successful!');
    console.log('User:', result.data.user.name);
    
    if (result.data.session?.access_token) {
      userToken = result.data.session.access_token;
      console.log('Token received:', userToken ? 'Yes' : 'No');
    }
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
};

const testGetProfile = async () => {
  console.log('\n👤 Testing Get Profile...');
  console.log('Using token:', userToken ? 'Yes' : 'No');
  
  const result = await apiCall('GET', '/api/auth/profile', null, userToken);
  
  if (result.success) {
    console.log('✅ Profile retrieved successfully!');
    console.log('Profile:', result.data.user);
    return true;
  } else {
    console.log('❌ Get profile failed:', result.error);
    return false;
  }
};

const testCreateUserProfile = async () => {
  console.log('\n📝 Testing Create User Profile...');
  console.log('Using token:', userToken ? 'Yes' : 'No');
  
  const profileData = {
    full_name: 'Matrix AI Global',
    phone: '+1234567890',
    date_of_birth: '1990-01-01',
    nationality: 'USA',
    current_location: 'New York',
    preferred_study_location: 'California',
    current_education_level: 'Bachelor',
    current_institution: 'MIT',
    current_gpa: 3.8,
    gpa_scale: '4.0',
    graduation_year: '2024',
    field_of_study: 'Computer Science',
    preferred_field: 'Artificial Intelligence',
    sat_score: 1500,
    toefl_score: 110,
    preferred_degree_level: 'Master',
    budget_range: '$50,000-$100,000',
    preferred_university_size: 'Large',
    preferred_campus_type: 'Urban',
    preferred_program_type: 'Research',
    extracurricular_activities: ['Coding', 'Research', 'Volunteering'],
    career_goals: 'Become an AI researcher',
    work_experience: '2 years as software engineer',
    languages: ['English', 'Spanish'],
    financial_aid_needed: true,
    scholarship_interests: 'Merit-based scholarships'
  };

  const result = await apiCall('POST', '/api/user/profile', profileData, userToken);
  
  if (result.success) {
    console.log('✅ User profile created successfully!');
    console.log('Completion:', result.data.profile.profile_completion_percentage + '%');
    return true;
  } else {
    console.log('❌ Create user profile failed:', result.error);
    return false;
  }
};

const testUpdateProfileFields = async () => {
  console.log('\n✏️ Testing Update Profile Fields...');
  const updates = {
    current_gpa: 3.9,
    gre_score: 330,
    awards: 'Dean\'s List, Best Project Award'
  };

  const result = await apiCall('PATCH', '/api/user/profile', updates, userToken);
  
  if (result.success) {
    console.log('✅ Profile fields updated successfully!');
    console.log('New completion:', result.data.profile.profile_completion_percentage + '%');
    return true;
  } else {
    console.log('❌ Update profile fields failed:', result.error);
    return false;
  }
};

const testGetUserProfile = async () => {
  console.log('\n📋 Testing Get User Profile...');
  const result = await apiCall('GET', '/api/user/profile', null, userToken);
  
  if (result.success) {
    console.log('✅ User profile retrieved successfully!');
    console.log('Full name:', result.data.profile.full_name);
    console.log('GPA:', result.data.profile.current_gpa);
    console.log('Completion:', result.data.profile.profile_completion_percentage + '%');
    return true;
  } else {
    console.log('❌ Get user profile failed:', result.error);
    return false;
  }
};

const testProfileCompletion = async () => {
  console.log('\n📊 Testing Profile Completion...');
  const result = await apiCall('GET', '/api/user/profile/completion', null, userToken);
  
  if (result.success) {
    console.log('✅ Profile completion retrieved successfully!');
    console.log('Completion data:', result.data);
    return true;
  } else {
    console.log('❌ Get profile completion failed:', result.error);
    return false;
  }
};

const testBlogCreation = async () => {
  console.log('\n📝 Testing Blog Creation...');
  const blogData = {
    title: 'AI in Education: The Future is Here',
    content: 'Artificial Intelligence is revolutionizing education by providing personalized learning experiences, automated grading, and intelligent tutoring systems. This comprehensive guide explores how AI is transforming the educational landscape and what it means for students and educators alike.',
    excerpt: 'Discover how AI is transforming education with personalized learning and intelligent systems.',
    category: 'Technology',
    tags: ['AI', 'Education', 'Technology', 'Innovation'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    uid: 'test-user-id' // This will be replaced by the actual user ID in a real scenario
  };

  const result = await apiCall('POST', '/api/blogs', blogData, userToken);
  
  if (result.success) {
    console.log('✅ Blog created successfully!');
    console.log('Blog ID:', result.data.blog?.id);
    return true;
  } else {
    console.log('❌ Blog creation failed:', result.error);
    console.log('Note: This might fail if user is not admin');
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting EduSmart API Tests...');
  console.log('=====================================');

  // Test registration first
  let registrationSuccess = await testRegistration();
  
  // If registration fails (user might already exist), try login
  if (!registrationSuccess) {
    console.log('\n🔄 Registration failed, trying login...');
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('❌ Both registration and login failed. Stopping tests.');
      return;
    }
  }

  // Check if we have a token before proceeding
  if (!userToken) {
    console.log('❌ No authentication token available. Cannot proceed with authenticated tests.');
    return;
  }

  console.log('\n🔑 Token available, proceeding with authenticated tests...');

  // Continue with other tests
  await testGetProfile();
  await testCreateUserProfile();
  await testUpdateProfileFields();
  await testGetUserProfile();
  await testProfileCompletion();
  await testBlogCreation();

  console.log('\n🎉 All tests completed!');
  console.log('=====================================');
};

// Run tests
runAllTests().catch(console.error); 