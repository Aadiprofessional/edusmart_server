const https = require('https');
const http = require('http');

// Base URL for the deployed API
const BASE_URL = 'https://edusmart-api-edusmar-service-naewilylpd.cn-hangzhou.fcapp.run';
const TEST_UID = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  details: {}
};

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EduSmart-API-Tester/1.0',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Log test result
function logResult(testName, success, response, error = null) {
  const result = {
    testName,
    success,
    statusCode: response?.statusCode,
    timestamp: new Date().toISOString(),
    response: response?.data,
    error: error?.message || null
  };

  if (success) {
    testResults.passed.push(testName);
  } else {
    testResults.failed.push(testName);
  }

  testResults.details[testName] = result;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`STATUS: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`HTTP STATUS: ${response?.statusCode || 'N/A'}`);
  
  if (error) {
    console.log(`ERROR: ${error.message}`);
  }
  
  if (response?.data) {
    console.log(`RESPONSE: ${JSON.stringify(response.data, null, 2)}`);
  }
  console.log(`${'='.repeat(60)}`);
}

// Test definitions
const tests = [
  {
    name: 'Health Check - Root Endpoint',
    method: 'GET',
    url: `${BASE_URL}/`,
    expectedStatus: 200
  },
  {
    name: 'Auth - Health Check',
    method: 'GET',
    url: `${BASE_URL}/api/auth`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Blogs - Get All Blogs',
    method: 'GET',
    url: `${BASE_URL}/api/blogs`,
    expectedStatus: 200
  },
  {
    name: 'Courses - Get All Courses',
    method: 'GET',
    url: `${BASE_URL}/api/courses`,
    expectedStatus: 200
  },
  {
    name: 'Enhanced Courses - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/v2/courses`,
    expectedStatus: 200
  },
  {
    name: 'Users - Get All Users',
    method: 'GET',
    url: `${BASE_URL}/api/users`,
    expectedStatus: 200
  },
  {
    name: 'Users - Get User by UID',
    method: 'GET',
    url: `${BASE_URL}/api/users?uid=${TEST_UID}`,
    expectedStatus: 200
  },
  {
    name: 'User Profile - Get Profile',
    method: 'GET',
    url: `${BASE_URL}/api/user`,
    expectedStatus: [200, 401]
  },
  {
    name: 'Case Studies - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/case-studies`,
    expectedStatus: 200
  },
  {
    name: 'Responses - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/responses`,
    expectedStatus: 200
  },
  {
    name: 'Scholarships - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/scholarships`,
    expectedStatus: 200
  },
  {
    name: 'Universities - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/universities`,
    expectedStatus: 200
  },
  {
    name: 'Subscriptions - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/subscriptions`,
    expectedStatus: 200
  },
  {
    name: 'Featured - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/featured`,
    expectedStatus: 200
  },
  {
    name: 'Homework - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/homework`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Homework - Create New',
    method: 'POST',
    url: `${BASE_URL}/api/homework`,
    data: {
      uid: TEST_UID,
      type: 'essay',
      subject: 'Mathematics',
      prompt: 'Test homework creation'
    },
    expectedStatus: [200, 201, 401]
  },
  {
    name: 'Mistake Checks - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/mistake-checks`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Flashcards - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/flashcards`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Content Writer - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/content-writer`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Study Planner - Get All',
    method: 'GET',
    url: `${BASE_URL}/api/study-planner`,
    expectedStatus: [200, 404]
  },
  {
    name: 'Uploads - Test Endpoint',
    method: 'GET',
    url: `${BASE_URL}/api/uploads`,
    expectedStatus: [200, 404]
  },
  // Test with authentication header
  {
    name: 'User Profile - With Mock Auth',
    method: 'GET',
    url: `${BASE_URL}/api/user/profile/${TEST_UID}`,
    headers: {
      'Authorization': 'Bearer mock-token'
    },
    expectedStatus: [200, 401]
  },
  // Test POST endpoints
  {
    name: 'Blogs - Create Blog (Test)',
    method: 'POST',
    url: `${BASE_URL}/api/blogs`,
    data: {
      title: 'Test Blog API',
      content: 'Testing blog creation API',
      excerpt: 'Test excerpt',
      category: 'Test',
      tags: ['test'],
      author_id: TEST_UID
    },
    expectedStatus: [200, 201, 401]
  },
  {
    name: 'Courses - Create Course (Test)',
    method: 'POST',
    url: `${BASE_URL}/api/courses`,
    data: {
      title: 'Test Course',
      description: 'Test course description',
      instructor: 'Test Instructor',
      duration: '4 weeks'
    },
    expectedStatus: [200, 201, 401]
  }
];

// Run all tests
async function runAllTests() {
  console.log(`\n🚀 Starting API Tests for EduSmart Server`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`👤 Test UID: ${TEST_UID}`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);

  let testCount = 0;
  
  for (const test of tests) {
    testCount++;
    try {
      console.log(`\n📝 Running test ${testCount}/${tests.length}: ${test.name}`);
      
      const response = await makeRequest(
        test.url, 
        test.method, 
        test.data, 
        test.headers || {}
      );

      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const success = expectedStatuses.includes(response.statusCode);
      
      logResult(test.name, success, response);
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      logResult(test.name, false, null, error);
    }
  }

  // Generate summary report
  console.log(`\n${'🎯'.repeat(30)}`);
  console.log(`📊 TEST SUMMARY REPORT`);
  console.log(`${'🎯'.repeat(30)}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`📈 Success Rate: ${((testResults.passed.length / tests.length) * 100).toFixed(1)}%`);
  
  console.log(`\n✅ WORKING ENDPOINTS:`);
  testResults.passed.forEach(test => console.log(`   • ${test}`));
  
  console.log(`\n❌ PROBLEMATIC ENDPOINTS:`);
  testResults.failed.forEach(test => {
    const details = testResults.details[test];
    console.log(`   • ${test}`);
    console.log(`     Status: ${details.statusCode}`);
    if (details.error) {
      console.log(`     Error: ${details.error}`);
    }
    if (details.response && typeof details.response === 'object' && details.response.error) {
      console.log(`     API Error: ${details.response.error}`);
    }
  });

  console.log(`\n📋 DETAILED ANALYSIS:`);
  const statusCodes = {};
  Object.values(testResults.details).forEach(detail => {
    const code = detail.statusCode || 'NO_RESPONSE';
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  Object.entries(statusCodes).forEach(([code, count]) => {
    console.log(`   ${code}: ${count} endpoints`);
  });

  console.log(`\n💾 Full test results saved to testResults object`);
  console.log(`🕒 Completed at: ${new Date().toISOString()}`);
}

// Export for use
module.exports = { runAllTests, testResults, makeRequest };

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 