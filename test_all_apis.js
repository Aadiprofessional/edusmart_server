import axios from 'axios';

// Test configuration
const LOCALHOST_BASE_URL = 'http://localhost:8000/api';
const PRODUCTION_BASE_URL = 'https://edusmart-server.pages.dev/api';

const ADMIN_CREDENTIALS = {
  email: 'matrixai.global@gmail.com',
  password: '12345678'
};

// Test data
const TEST_UNIVERSITY = {
  name: 'Test University API',
  description: 'A comprehensive test university for API validation with detailed information about programs and facilities.',
  country: 'United States',
  city: 'Test City',
  state: 'California',
  type: 'Public',
  ranking: 100,
  tuition_fee: 50000,
  acceptance_rate: 15.5,
  student_population: 25000,
  programs_offered: ['Computer Science', 'Engineering', 'Business'],
  facilities: ['Library', 'Sports Complex', 'Research Labs']
};

const TEST_SCHOLARSHIP = {
  title: 'Test API Scholarship Program',
  description: 'This is a comprehensive test scholarship program designed to validate API functionality. It offers financial support to deserving students pursuing higher education in various fields.',
  amount: 10000,
  eligibility: 'Undergraduate students with GPA > 3.5',
  deadline: '2024-12-31',
  university: 'Test University',
  country: 'United States',
  application_link: 'https://example.com/apply',
  requirements: ['Academic transcripts', 'Personal statement', 'Letters of recommendation']
};

const TEST_RESPONSE = {
  title: 'Test API Response Document',
  description: 'This is a comprehensive test response document created to validate API functionality and ensure proper data handling.',
  type: 'document',
  category: 'academic',
  url: 'https://example.com/document.pdf',
  featured: false,
  tags: ['test', 'api', 'validation']
};

const TEST_CASE_STUDY = {
  title: 'Test API Case Study',
  description: 'This is a comprehensive test case study created to validate API functionality and demonstrate successful student outcomes.',
  student_name: 'John Doe',
  target_country: 'United States',
  outcome: 'Accepted',
  category: 'undergraduate',
  story_content: 'This is a detailed story about the student\'s journey to success.',
  featured: false,
  tags: ['test', 'api', 'success']
};

// Helper functions
async function loginAdmin(baseUrl) {
  try {
    const response = await axios.post(`${baseUrl}/auth/login`, ADMIN_CREDENTIALS);
    return response.data.session.access_token;
  } catch (error) {
    console.error(`❌ Admin login failed for ${baseUrl}:`, error.response?.data || error.message);
    return null;
  }
}

function getAuthHeaders(token, uid) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function testAPI(name, testFunction) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    await testFunction();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED:`, error.message);
  }
}

// Test functions for each API
async function testUniversityAPIs(baseUrl, token, uid) {
  const headers = getAuthHeaders(token, uid);
  let createdUniversityId = null;

  // Test GET all universities
  await testAPI(`${baseUrl} - GET Universities`, async () => {
    const response = await axios.get(`${baseUrl}/universities?page=1&limit=5`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📊 Found ${response.data.universities?.length || 0} universities`);
  });

  // Test GET university countries
  await testAPI(`${baseUrl} - GET University Countries`, async () => {
    const response = await axios.get(`${baseUrl}/universities/countries`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🌍 Found ${response.data.countries?.length || 0} countries`);
  });

  // Test POST create university
  await testAPI(`${baseUrl} - POST Create University`, async () => {
    const response = await axios.post(`${baseUrl}/universities`, {
      ...TEST_UNIVERSITY,
      uid: uid
    }, { headers });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    createdUniversityId = response.data.university.id;
    console.log(`   ✨ Created university with ID: ${createdUniversityId}`);
  });

  // Test GET university by ID
  if (createdUniversityId) {
    await testAPI(`${baseUrl} - GET University by ID`, async () => {
      const response = await axios.get(`${baseUrl}/universities/${createdUniversityId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📖 Retrieved university: ${response.data.university.name}`);
    });

    // Test PUT update university
    await testAPI(`${baseUrl} - PUT Update University`, async () => {
      const response = await axios.put(`${baseUrl}/universities/${createdUniversityId}`, {
        ...TEST_UNIVERSITY,
        name: 'Updated Test University API',
        uid: uid
      }, { headers });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📝 Updated university name`);
    });

    // Test DELETE university
    await testAPI(`${baseUrl} - DELETE University`, async () => {
      const response = await axios.delete(`${baseUrl}/universities/${createdUniversityId}`, {
        headers,
        data: { uid: uid }
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   🗑️ Deleted university`);
    });
  }

  // Test search universities
  await testAPI(`${baseUrl} - GET Search Universities`, async () => {
    const response = await axios.get(`${baseUrl}/universities/search?query=university`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🔍 Search found ${response.data.universities?.length || 0} universities`);
  });
}

async function testScholarshipAPIs(baseUrl, token, uid) {
  const headers = getAuthHeaders(token, uid);
  let createdScholarshipId = null;

  // Test GET all scholarships
  await testAPI(`${baseUrl} - GET Scholarships`, async () => {
    const response = await axios.get(`${baseUrl}/scholarships?page=1&limit=5`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📊 Found ${response.data.scholarships?.length || 0} scholarships`);
  });

  // Test GET scholarship countries
  await testAPI(`${baseUrl} - GET Scholarship Countries`, async () => {
    const response = await axios.get(`${baseUrl}/scholarships/countries`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🌍 Found ${response.data.countries?.length || 0} countries`);
  });

  // Test GET scholarship universities
  await testAPI(`${baseUrl} - GET Scholarship Universities`, async () => {
    const response = await axios.get(`${baseUrl}/scholarships/universities`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🏫 Found ${response.data.universities?.length || 0} universities`);
  });

  // Test POST create scholarship
  await testAPI(`${baseUrl} - POST Create Scholarship`, async () => {
    const response = await axios.post(`${baseUrl}/scholarships`, {
      ...TEST_SCHOLARSHIP,
      uid: uid
    }, { headers });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    createdScholarshipId = response.data.scholarship.id;
    console.log(`   ✨ Created scholarship with ID: ${createdScholarshipId}`);
  });

  // Test GET scholarship by ID
  if (createdScholarshipId) {
    await testAPI(`${baseUrl} - GET Scholarship by ID`, async () => {
      const response = await axios.get(`${baseUrl}/scholarships/${createdScholarshipId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📖 Retrieved scholarship: ${response.data.scholarship.title}`);
    });

    // Test PUT update scholarship
    await testAPI(`${baseUrl} - PUT Update Scholarship`, async () => {
      const response = await axios.put(`${baseUrl}/scholarships/${createdScholarshipId}`, {
        ...TEST_SCHOLARSHIP,
        title: 'Updated Test API Scholarship Program',
        uid: uid
      }, { headers });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📝 Updated scholarship title`);
    });

    // Test DELETE scholarship
    await testAPI(`${baseUrl} - DELETE Scholarship`, async () => {
      const response = await axios.delete(`${baseUrl}/scholarships/${createdScholarshipId}`, {
        headers,
        data: { uid: uid }
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   🗑️ Deleted scholarship`);
    });
  }
}

async function testResponseAPIs(baseUrl, token, uid) {
  const headers = getAuthHeaders(token, uid);
  let createdResponseId = null;

  // Test GET all responses
  await testAPI(`${baseUrl} - GET Responses`, async () => {
    const response = await axios.get(`${baseUrl}/responses?page=1&limit=5`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📊 Found ${response.data.responses?.length || 0} responses`);
  });

  // Test GET response categories
  await testAPI(`${baseUrl} - GET Response Categories`, async () => {
    const response = await axios.get(`${baseUrl}/responses/categories`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📂 Found ${response.data.categories?.length || 0} categories`);
  });

  // Test GET response types
  await testAPI(`${baseUrl} - GET Response Types`, async () => {
    const response = await axios.get(`${baseUrl}/responses/types`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📋 Found ${response.data.types?.length || 0} types`);
  });

  // Test POST create response
  await testAPI(`${baseUrl} - POST Create Response`, async () => {
    const response = await axios.post(`${baseUrl}/responses`, {
      ...TEST_RESPONSE,
      uid: uid
    }, { headers });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    createdResponseId = response.data.response.id;
    console.log(`   ✨ Created response with ID: ${createdResponseId}`);
  });

  // Test GET response by ID
  if (createdResponseId) {
    await testAPI(`${baseUrl} - GET Response by ID`, async () => {
      const response = await axios.get(`${baseUrl}/responses/${createdResponseId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📖 Retrieved response: ${response.data.response.title}`);
    });

    // Test PUT update response
    await testAPI(`${baseUrl} - PUT Update Response`, async () => {
      const response = await axios.put(`${baseUrl}/responses/${createdResponseId}`, {
        ...TEST_RESPONSE,
        title: 'Updated Test API Response Document',
        uid: uid
      }, { headers });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📝 Updated response title`);
    });

    // Test DELETE response
    await testAPI(`${baseUrl} - DELETE Response`, async () => {
      const response = await axios.delete(`${baseUrl}/responses/${createdResponseId}`, {
        headers,
        data: { uid: uid }
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   🗑️ Deleted response`);
    });
  }
}

async function testCaseStudyAPIs(baseUrl, token, uid) {
  const headers = getAuthHeaders(token, uid);
  let createdCaseStudyId = null;

  // Test GET all case studies
  await testAPI(`${baseUrl} - GET Case Studies`, async () => {
    const response = await axios.get(`${baseUrl}/case-studies?page=1&limit=5`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📊 Found ${response.data.caseStudies?.length || 0} case studies`);
  });

  // Test GET case study categories
  await testAPI(`${baseUrl} - GET Case Study Categories`, async () => {
    const response = await axios.get(`${baseUrl}/case-studies/categories`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   📂 Found ${response.data.categories?.length || 0} categories`);
  });

  // Test GET case study outcomes
  await testAPI(`${baseUrl} - GET Case Study Outcomes`, async () => {
    const response = await axios.get(`${baseUrl}/case-studies/outcomes`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🎯 Found ${response.data.outcomes?.length || 0} outcomes`);
  });

  // Test GET case study countries
  await testAPI(`${baseUrl} - GET Case Study Countries`, async () => {
    const response = await axios.get(`${baseUrl}/case-studies/countries`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🌍 Found ${response.data.countries?.length || 0} countries`);
  });

  // Test GET case study fields
  await testAPI(`${baseUrl} - GET Case Study Fields`, async () => {
    const response = await axios.get(`${baseUrl}/case-studies/fields`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   🎓 Found ${response.data.fields?.length || 0} fields`);
  });

  // Test POST create case study
  await testAPI(`${baseUrl} - POST Create Case Study`, async () => {
    const response = await axios.post(`${baseUrl}/case-studies`, {
      ...TEST_CASE_STUDY,
      uid: uid
    }, { headers });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    createdCaseStudyId = response.data.caseStudy.id;
    console.log(`   ✨ Created case study with ID: ${createdCaseStudyId}`);
  });

  // Test GET case study by ID
  if (createdCaseStudyId) {
    await testAPI(`${baseUrl} - GET Case Study by ID`, async () => {
      const response = await axios.get(`${baseUrl}/case-studies/${createdCaseStudyId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📖 Retrieved case study: ${response.data.caseStudy.title}`);
    });

    // Test PUT update case study
    await testAPI(`${baseUrl} - PUT Update Case Study`, async () => {
      const response = await axios.put(`${baseUrl}/case-studies/${createdCaseStudyId}`, {
        ...TEST_CASE_STUDY,
        title: 'Updated Test API Case Study',
        uid: uid
      }, { headers });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   📝 Updated case study title`);
    });

    // Test DELETE case study
    await testAPI(`${baseUrl} - DELETE Case Study`, async () => {
      const response = await axios.delete(`${baseUrl}/case-studies/${createdCaseStudyId}`, {
        headers,
        data: { uid: uid }
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   🗑️ Deleted case study`);
    });
  }
}

async function testEnvironment(baseUrl, environmentName) {
  console.log(`\n🌐 Testing ${environmentName} Environment: ${baseUrl}`);
  console.log('=' .repeat(60));

  // Login as admin
  console.log('\n🔐 Authenticating as admin...');
  const token = await loginAdmin(baseUrl);
  if (!token) {
    console.log(`❌ Failed to authenticate admin for ${environmentName}`);
    return;
  }
  console.log('✅ Admin authentication successful');

  // Get admin UID (from the login response)
  const adminUid = '5f21c714-a255-4bab-864e-a36c63466a95';

  // Test all APIs
  console.log(`\n📚 Testing University APIs for ${environmentName}...`);
  await testUniversityAPIs(baseUrl, token, adminUid);

  console.log(`\n🎓 Testing Scholarship APIs for ${environmentName}...`);
  await testScholarshipAPIs(baseUrl, token, adminUid);

  console.log(`\n📄 Testing Response APIs for ${environmentName}...`);
  await testResponseAPIs(baseUrl, token, adminUid);

  console.log(`\n📖 Testing Case Study APIs for ${environmentName}...`);
  await testCaseStudyAPIs(baseUrl, token, adminUid);
}

async function main() {
  console.log('🚀 Starting Comprehensive API Testing');
  console.log('Testing Universities, Scholarships, Responses, and Case Studies APIs');
  console.log('Admin Credentials:', ADMIN_CREDENTIALS.email);

  try {
    // Test localhost
    await testEnvironment(LOCALHOST_BASE_URL, 'LOCALHOST');

    // Test production
    await testEnvironment(PRODUCTION_BASE_URL, 'PRODUCTION');

    console.log('\n🎉 API Testing Complete!');
    console.log('Check the results above for any failures.');

  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error.message);
  }
}

// Run the tests
main().catch(console.error); 