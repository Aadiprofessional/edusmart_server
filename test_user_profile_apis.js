const axios = require('axios');

const BASE_URL = 'https://edusmart-server.vercel.app';

// Test data for profile creation/update
const testProfileData = {
  full_name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1995-05-15",
  nationality: "American",
  current_location: "New York, USA",
  preferred_study_location: "Canada",
  current_education_level: "Bachelor's",
  current_institution: "NYU",
  current_gpa: "3.8",
  gpa_scale: "4.0",
  graduation_year: "2024",
  field_of_study: "Computer Science",
  preferred_field: "Data Science",
  preferred_degree_level: "Master's",
  budget_range: "$50,000 - $70,000",
  preferred_university_size: "Large",
  preferred_campus_type: "Urban",
  preferred_program_type: "Research-based",
  career_goals: "Data Scientist at tech company",
  work_experience: "2 years as software developer"
};

// You'll need to replace this with a valid JWT token
const TEST_TOKEN = 'your-jwt-token-here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testUserProfileAPIs() {
  console.log('🚀 Testing User Profile APIs...\n');

  const tests = [
    {
      name: 'Get User Profile (Initial - Should be 404)',
      method: 'GET',
      url: '/api/user/profile',
      expectedStatus: [200, 404]
    },
    {
      name: 'Create User Profile',
      method: 'POST',
      url: '/api/user/profile',
      data: testProfileData,
      expectedStatus: [201]
    },
    {
      name: 'Get User Profile (After Creation)',
      method: 'GET',
      url: '/api/user/profile',
      expectedStatus: [200]
    },
    {
      name: 'Get Profile Completion',
      method: 'GET',
      url: '/api/user/profile/completion',
      expectedStatus: [200]
    },
    {
      name: 'Update Profile Fields (PATCH)',
      method: 'PATCH',
      url: '/api/user/profile',
      data: {
        current_gpa: "3.9",
        career_goals: "Senior Data Scientist at FAANG company"
      },
      expectedStatus: [200]
    },
    {
      name: 'Update Complete Profile (PUT)',
      method: 'PUT',
      url: '/api/user/profile',
      data: {
        ...testProfileData,
        current_gpa: "4.0",
        preferred_study_location: "United Kingdom"
      },
      expectedStatus: [200]
    },
    {
      name: 'Get Updated Profile',
      method: 'GET',
      url: '/api/user/profile',
      expectedStatus: [200]
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      let response;
      const config = {
        timeout: 10000,
        headers,
        validateStatus: (status) => test.expectedStatus.includes(status)
      };

      switch (test.method) {
        case 'GET':
          response = await axios.get(`${BASE_URL}${test.url}`, config);
          break;
        case 'POST':
          response = await axios.post(`${BASE_URL}${test.url}`, test.data, config);
          break;
        case 'PUT':
          response = await axios.put(`${BASE_URL}${test.url}`, test.data, config);
          break;
        case 'PATCH':
          response = await axios.patch(`${BASE_URL}${test.url}`, test.data, config);
          break;
        case 'DELETE':
          response = await axios.delete(`${BASE_URL}${test.url}`, config);
          break;
      }
      
      console.log(`✅ ${test.name}: ${response.status} - ${response.statusText}`);
      
      // Log response data for verification
      if (response.data) {
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
        if (response.data.profile) {
          console.log(`   Profile ID: ${response.data.profile.id}`);
          console.log(`   Full Name: ${response.data.profile.full_name}`);
          console.log(`   Completion: ${response.data.profile.profile_completion_percentage}%`);
        }
        if (response.data.completion_percentage !== undefined) {
          console.log(`   Completion Percentage: ${response.data.completion_percentage}%`);
        }
        if (response.data.error) {
          console.log(`   Error: ${response.data.error}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'Network Error'} - ${error.response?.statusText || error.message}`);
      if (error.response?.data) {
        console.log(`   Error Details: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }

  console.log('🏁 User Profile API Testing complete!');
}

async function testAdminUserAPIs() {
  console.log('🚀 Testing Admin User APIs...\n');

  const adminTests = [
    {
      name: 'Get All Users',
      method: 'GET',
      url: '/api/users',
      expectedStatus: [200]
    },
    {
      name: 'Get User Statistics',
      method: 'GET',
      url: '/api/users/stats/overview',
      expectedStatus: [200]
    }
  ];

  for (const test of adminTests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      const response = await axios.get(`${BASE_URL}${test.url}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${test.name}: ${response.status} - ${response.statusText}`);
      
      if (response.data) {
        if (response.data.success !== undefined) {
          console.log(`   Success: ${response.data.success}`);
        }
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            console.log(`   Users Count: ${response.data.data.length}`);
          } else if (response.data.data.totalUsers !== undefined) {
            console.log(`   Total Users: ${response.data.data.totalUsers}`);
            console.log(`   Admin Users: ${response.data.data.adminUsers}`);
            console.log(`   New Users This Month: ${response.data.data.newUsersThisMonth}`);
            console.log(`   Active Users: ${response.data.data.activeUsers}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'Network Error'} - ${error.response?.statusText || error.message}`);
      if (error.response?.data) {
        console.log(`   Error Details: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Admin User API Testing complete!');
}

// Run tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('EDUSMART API TESTING SUITE');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('📝 NOTE: For user profile APIs, you need to:');
  console.log('1. Replace TEST_TOKEN with a valid JWT token');
  console.log('2. Make sure you have authentication set up');
  console.log('');
  
  await testAdminUserAPIs();
  console.log('\n' + '='.repeat(60) + '\n');
  await testUserProfileAPIs();
}

runAllTests().catch(console.error); 