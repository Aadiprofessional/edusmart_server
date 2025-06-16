import axios from 'axios';

// Configuration
const LOCALHOST_BASE_URL = 'http://localhost:8000';
const PRODUCTION_BASE_URL = 'https://edusmart-server.pages.dev';
const ADMIN_EMAIL = 'matrixai.global@gmail.com';
const ADMIN_PASSWORD = '12345678';

// Test configuration
let currentBaseUrl = LOCALHOST_BASE_URL;
let adminToken = null;
let adminUid = null;

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${currentBaseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

// Authentication function
const authenticateAdmin = async () => {
  console.log('\n🔐 Authenticating admin...');
  
  const result = await apiCall('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  if (result.success) {
    adminToken = result.data.token;
    adminUid = result.data.user?.id;
    console.log('✅ Admin authenticated successfully');
    console.log(`   Token: ${adminToken?.substring(0, 20)}...`);
    console.log(`   UID: ${adminUid}`);
    return true;
  } else {
    console.log('❌ Admin authentication failed:', result.error);
    return false;
  }
};

// Test functions for Universities
const testUniversityAPIs = async () => {
  console.log('\n🏫 Testing University APIs...\n');
  
  // Test 1: Get all universities
  console.log('1. Testing GET /api/universities');
  let result = await apiCall('GET', '/api/universities');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.universities?.length || 0} universities` : result.error);
  
  // Test 2: Get universities with pagination
  console.log('2. Testing GET /api/universities with pagination');
  result = await apiCall('GET', '/api/universities?page=1&limit=5');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Page 1, ${result.data.universities?.length || 0} universities` : result.error);
  
  // Test 3: Get universities by country
  console.log('3. Testing GET /api/universities/countries');
  result = await apiCall('GET', '/api/universities/countries');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.countries?.length || 0} countries` : result.error);
  
  // Test 4: Search universities
  console.log('4. Testing GET /api/universities/search/harvard');
  result = await apiCall('GET', '/api/universities/search/harvard');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.universities?.length || 0} universities` : result.error);
  
  // Test 5: Get university by ID (we'll use a dummy ID for now)
  console.log('5. Testing GET /api/universities/:id');
  result = await apiCall('GET', '/api/universities/dummy-id');
  console.log(result.success ? '✅ Success' : '❌ Failed (expected):', result.error);
  
  // Admin-only tests (require authentication)
  if (adminUid) {
    console.log('\n--- Admin-only University Tests ---');
    
    // Test 6: Create university
    console.log('6. Testing POST /api/universities (Create)');
    const newUniversity = {
      uid: adminUid,
      name: 'Test University',
      description: 'A test university for API testing',
      country: 'United States',
      city: 'Test City',
      state: 'Test State',
      website: 'https://testuniversity.edu',
      contact_email: 'contact@testuniversity.edu',
      established_year: 2000,
      type: 'Public',
      ranking: 100,
      tuition_fee: 50000,
      programs_offered: ['Computer Science', 'Engineering'],
      facilities: ['Library', 'Lab']
    };
    
    result = await apiCall('POST', '/api/universities', newUniversity);
    console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'University created' : result.error);
    
    let createdUniversityId = null;
    if (result.success) {
      createdUniversityId = result.data.university?.id;
      console.log(`   Created University ID: ${createdUniversityId}`);
      
      // Test 7: Update university
      console.log('7. Testing PUT /api/universities/:id (Update)');
      const updateData = {
        uid: adminUid,
        name: 'Updated Test University',
        description: 'An updated test university'
      };
      
      result = await apiCall('PUT', `/api/universities/${createdUniversityId}`, updateData);
      console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'University updated' : result.error);
      
      // Test 8: Delete university
      console.log('8. Testing DELETE /api/universities/:id');
      result = await apiCall('DELETE', `/api/universities/${createdUniversityId}`, { uid: adminUid });
      console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'University deleted' : result.error);
    }
  } else {
    console.log('\n--- Skipping Admin-only University Tests (No admin authentication) ---');
  }
};

// Test functions for Scholarships
const testScholarshipAPIs = async () => {
  console.log('\n🎓 Testing Scholarship APIs...\n');
  
  // Test 1: Get all scholarships
  console.log('1. Testing GET /api/scholarships');
  let result = await apiCall('GET', '/api/scholarships');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.scholarships?.length || 0} scholarships` : result.error);
  
  // Test 2: Get scholarships with pagination
  console.log('2. Testing GET /api/scholarships with pagination');
  result = await apiCall('GET', '/api/scholarships?page=1&limit=5');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Page 1, ${result.data.scholarships?.length || 0} scholarships` : result.error);
  
  // Test 3: Get scholarship countries
  console.log('3. Testing GET /api/scholarship-countries');
  result = await apiCall('GET', '/api/scholarship-countries');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.countries?.length || 0} countries` : result.error);
  
  // Test 4: Get scholarship universities
  console.log('4. Testing GET /api/scholarship-universities');
  result = await apiCall('GET', '/api/scholarship-universities');
  console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? `Found ${result.data.universities?.length || 0} universities` : result.error);
  
  // Test 5: Get scholarship by ID (we'll use a dummy ID for now)
  console.log('5. Testing GET /api/scholarships/:id');
  result = await apiCall('GET', '/api/scholarships/dummy-id');
  console.log(result.success ? '✅ Success' : '❌ Failed (expected):', result.error);
  
  // Admin-only tests (require authentication)
  if (adminUid) {
    console.log('\n--- Admin-only Scholarship Tests ---');
    
    // Test 6: Create scholarship
    console.log('6. Testing POST /api/scholarships (Create)');
    const newScholarship = {
      uid: adminUid,
      title: 'Test Scholarship',
      description: 'A comprehensive test scholarship for API testing purposes. This scholarship is designed to help students pursue their academic goals and achieve excellence in their chosen field of study.',
      amount: 5000,
      eligibility: 'Test eligibility criteria',
      deadline: '2024-12-31',
      university: 'Test University',
      country: 'United States',
      application_link: 'https://testscholarship.com/apply',
      requirements: ['GPA 3.0+', 'Essay required']
    };
    
    result = await apiCall('POST', '/api/scholarships', newScholarship);
    console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'Scholarship created' : result.error);
    
    let createdScholarshipId = null;
    if (result.success) {
      createdScholarshipId = result.data.scholarship?.id;
      console.log(`   Created Scholarship ID: ${createdScholarshipId}`);
      
      // Test 7: Update scholarship
      console.log('7. Testing PUT /api/scholarships/:id (Update)');
      const updateData = {
        uid: adminUid,
        title: 'Updated Test Scholarship',
        description: 'An updated test scholarship',
        amount: 7500
      };
      
      result = await apiCall('PUT', `/api/scholarships/${createdScholarshipId}`, updateData);
      console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'Scholarship updated' : result.error);
      
      // Test 8: Delete scholarship
      console.log('8. Testing DELETE /api/scholarships/:id');
      result = await apiCall('DELETE', `/api/scholarships/${createdScholarshipId}`, { uid: adminUid });
      console.log(result.success ? '✅ Success' : '❌ Failed:', result.success ? 'Scholarship deleted' : result.error);
    }
  } else {
    console.log('\n--- Skipping Admin-only Scholarship Tests (No admin authentication) ---');
  }
};

// Main test function
const runTests = async (useProduction = false) => {
  currentBaseUrl = useProduction ? PRODUCTION_BASE_URL : LOCALHOST_BASE_URL;
  
  console.log(`\n🚀 Starting API Tests on ${useProduction ? 'PRODUCTION' : 'LOCALHOST'}`);
  console.log(`   Base URL: ${currentBaseUrl}`);
  console.log('='.repeat(60));
  
  // Test server connectivity
  console.log('\n🔍 Testing server connectivity...');
  const healthCheck = await apiCall('GET', '/');
  if (!healthCheck.success) {
    console.log('❌ Server is not accessible:', healthCheck.error);
    return;
  }
  console.log('✅ Server is accessible');
  
  // Authenticate admin
  await authenticateAdmin();
  
  // Run tests
  await testUniversityAPIs();
  await testScholarshipAPIs();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Tests completed!');
};

// Run tests
const main = async () => {
  console.log('EduSmart API Testing Suite');
  console.log('==========================');
  
  // Test localhost first
  console.log('\n📍 Testing LOCALHOST...');
  await runTests(false);
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test production
  console.log('\n📍 Testing PRODUCTION...');
  await runTests(true);
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--localhost-only')) {
  runTests(false);
} else if (args.includes('--production-only')) {
  runTests(true);
} else {
  main();
} 