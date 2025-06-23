#!/usr/bin/env node

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test credentials
const TEST_CREDENTIALS = {
  email: 'matrixai.global@gmail.com',
  password: '12345678'
};

// API endpoints
const ENDPOINTS = {
  localhost: 'http://localhost:8000/api',
  production: 'https://edusmart-api.pages.dev/api'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Utility function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { error: 'Invalid JSON response', data };
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      headers: {}
    };
  }
}

// Test authentication
async function testAuth(baseUrl) {
  log(`\n🔐 Testing Authentication at ${baseUrl}`, colors.cyan);
  
  // Test login
  log('  📝 Testing Login...', colors.yellow);
  const loginResult = await makeRequest(`${baseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  if (loginResult.success) {
    log(`  ✅ Login successful`, colors.green);
    const token = loginResult.data.access_token || loginResult.data.session?.access_token;
    
    if (token) {
      log(`  🎫 Token received: ${token.substring(0, 20)}...`, colors.green);
      
      // Test get profile with token
      log('  👤 Testing Get Profile...', colors.yellow);
      const profileResult = await makeRequest(`${baseUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResult.success) {
        log(`  ✅ Profile retrieved successfully`, colors.green);
        log(`  📋 User ID: ${profileResult.data.user?.id}`, colors.blue);
        log(`  📧 Email: ${profileResult.data.user?.email}`, colors.blue);
        return { success: true, token, userId: profileResult.data.user?.id };
      } else {
        log(`  ❌ Profile retrieval failed: ${profileResult.data.error}`, colors.red);
        return { success: false, error: profileResult.data.error };
      }
    } else {
      log(`  ❌ No token in login response`, colors.red);
      return { success: false, error: 'No token received' };
    }
  } else {
    log(`  ❌ Login failed: ${loginResult.data.error}`, colors.red);
    return { success: false, error: loginResult.data.error };
  }
}

// Test user profile APIs
async function testUserProfileAPIs(baseUrl, token, userId) {
  log(`\n👤 Testing User Profile APIs at ${baseUrl}`, colors.cyan);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // Sample profile data
  const sampleProfile = {
    full_name: 'Matrix AI Test User',
    date_of_birth: '1995-01-15',
    phone_number: '+1234567890',
    country: 'United States',
    state: 'California',
    city: 'San Francisco',
    address: '123 Test Street',
    postal_code: '94102',
    education_level: 'Undergraduate',
    field_of_study: 'Computer Science',
    current_institution: 'Test University',
    current_gpa: 3.5,
    career_interests: ['Software Engineering', 'Data Science'],
    extracurricular_activities: ['Programming Club', 'Robotics Team'],
    languages: ['English', 'Spanish'],
    financial_aid_needed: true,
    preferred_countries: ['United States', 'Canada'],
    target_degree: 'Bachelor of Science',
    sat_score: 1450,
    act_score: 32,
    toefl_score: 110,
    ielts_score: 8.0
  };

  // Test 1: Get existing profile
  log('  📖 Testing GET /user/profile...', colors.yellow);
  const getResult = await makeRequest(`${baseUrl}/user/profile`, {
    method: 'GET',
    headers
  });
  
  if (getResult.success) {
    log(`  ✅ Profile retrieved successfully`, colors.green);
    log(`  📊 Profile data keys: ${Object.keys(getResult.data.data || {}).length}`, colors.blue);
  } else if (getResult.status === 404) {
    log(`  ℹ️  No existing profile found (expected for new user)`, colors.yellow);
  } else {
    log(`  ❌ GET profile failed: ${getResult.data.error}`, colors.red);
  }

  // Test 2: Create/Update profile (POST)
  log('  📝 Testing POST /user/profile (Create/Update)...', colors.yellow);
  const createResult = await makeRequest(`${baseUrl}/user/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(sampleProfile)
  });

  if (createResult.success) {
    log(`  ✅ Profile created/updated successfully`, colors.green);
    log(`  📋 Profile ID: ${createResult.data.data?.id}`, colors.blue);
  } else {
    log(`  ❌ POST profile failed: ${createResult.data.error}`, colors.red);
  }

  // Test 3: Update profile (PUT)
  log('  🔄 Testing PUT /user/profile (Full Update)...', colors.yellow);
  const updatedProfile = {
    ...sampleProfile,
    full_name: 'Matrix AI Updated User',
    current_gpa: 3.8
  };
  
  const updateResult = await makeRequest(`${baseUrl}/user/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updatedProfile)
  });

  if (updateResult.success) {
    log(`  ✅ Profile updated successfully`, colors.green);
  } else {
    log(`  ❌ PUT profile failed: ${updateResult.data.error}`, colors.red);
  }

  // Test 4: Partial update (PATCH)
  log('  🔧 Testing PATCH /user/profile (Partial Update)...', colors.yellow);
  const partialUpdate = {
    current_gpa: 3.9,
    phone_number: '+1987654321'
  };
  
  const patchResult = await makeRequest(`${baseUrl}/user/profile`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(partialUpdate)
  });

  if (patchResult.success) {
    log(`  ✅ Profile partially updated successfully`, colors.green);
  } else {
    log(`  ❌ PATCH profile failed: ${patchResult.data.error}`, colors.red);
  }

  // Test 5: Get profile completion
  log('  📊 Testing GET /user/profile/completion...', colors.yellow);
  const completionResult = await makeRequest(`${baseUrl}/user/profile/completion`, {
    method: 'GET',
    headers
  });

  if (completionResult.success) {
    log(`  ✅ Profile completion retrieved: ${completionResult.data.completion_percentage}%`, colors.green);
  } else {
    log(`  ❌ GET completion failed: ${completionResult.data.error}`, colors.red);
  }

  // Test 6: Get updated profile to verify changes
  log('  🔍 Testing final GET /user/profile to verify updates...', colors.yellow);
  const finalGetResult = await makeRequest(`${baseUrl}/user/profile`, {
    method: 'GET',
    headers
  });

  if (finalGetResult.success) {
    log(`  ✅ Final profile retrieved successfully`, colors.green);
    const profile = finalGetResult.data.data;
    log(`  📝 Name: ${profile.full_name}`, colors.blue);
    log(`  📊 GPA: ${profile.current_gpa}`, colors.blue);
    log(`  📞 Phone: ${profile.phone_number}`, colors.blue);
    log(`  🎓 Education: ${profile.education_level}`, colors.blue);
  } else {
    log(`  ❌ Final GET profile failed: ${finalGetResult.data.error}`, colors.red);
  }

  // Test legacy routes for backward compatibility
  log('  🔄 Testing legacy /user-profile routes...', colors.yellow);
  
  const legacyGetResult = await makeRequest(`${baseUrl}/user-profile`, {
    method: 'GET',
    headers
  });

  if (legacyGetResult.success) {
    log(`  ✅ Legacy GET /user-profile works`, colors.green);
  } else {
    log(`  ❌ Legacy GET /user-profile failed: ${legacyGetResult.data.error}`, colors.red);
  }

  return {
    get: getResult.success,
    create: createResult.success,
    update: updateResult.success,
    patch: patchResult.success,
    completion: completionResult.success,
    finalGet: finalGetResult.success,
    legacy: legacyGetResult.success
  };
}

// Main test function
async function runTests() {
  log('🚀 Starting Profile API Tests', colors.bright);
  log('================================', colors.bright);
  
  const results = {};
  
  for (const [env, baseUrl] of Object.entries(ENDPOINTS)) {
    log(`\n🌐 Testing ${env.toUpperCase()} Environment`, colors.magenta);
    log(`🔗 Base URL: ${baseUrl}`, colors.blue);
    
    try {
      // Test authentication first
      const authResult = await testAuth(baseUrl);
      
      if (authResult.success) {
        // Test profile APIs
        const profileResults = await testUserProfileAPIs(baseUrl, authResult.token, authResult.userId);
        
        results[env] = {
          auth: true,
          profiles: profileResults
        };
      } else {
        log(`❌ Skipping profile tests due to auth failure`, colors.red);
        results[env] = {
          auth: false,
          error: authResult.error
        };
      }
    } catch (error) {
      log(`💥 Unexpected error testing ${env}: ${error.message}`, colors.red);
      results[env] = {
        error: error.message
      };
    }
  }
  
  // Print summary
  log('\n📊 TEST SUMMARY', colors.bright);
  log('================', colors.bright);
  
  for (const [env, result] of Object.entries(results)) {
    log(`\n${env.toUpperCase()}:`, colors.cyan);
    if (result.auth) {
      log(`  ✅ Authentication: PASSED`, colors.green);
      if (result.profiles) {
        const profileTests = result.profiles;
        log(`  📖 GET Profile: ${profileTests.get ? '✅ PASSED' : '❌ FAILED'}`, profileTests.get ? colors.green : colors.red);
        log(`  📝 CREATE Profile: ${profileTests.create ? '✅ PASSED' : '❌ FAILED'}`, profileTests.create ? colors.green : colors.red);
        log(`  🔄 UPDATE Profile: ${profileTests.update ? '✅ PASSED' : '❌ FAILED'}`, profileTests.update ? colors.green : colors.red);
        log(`  🔧 PATCH Profile: ${profileTests.patch ? '✅ PASSED' : '❌ FAILED'}`, profileTests.patch ? colors.green : colors.red);
        log(`  📊 Completion: ${profileTests.completion ? '✅ PASSED' : '❌ FAILED'}`, profileTests.completion ? colors.green : colors.red);
        log(`  🔍 Final GET: ${profileTests.finalGet ? '✅ PASSED' : '❌ FAILED'}`, profileTests.finalGet ? colors.green : colors.red);
        log(`  🔄 Legacy Routes: ${profileTests.legacy ? '✅ PASSED' : '❌ FAILED'}`, profileTests.legacy ? colors.green : colors.red);
      }
    } else {
      log(`  ❌ Authentication: FAILED - ${result.error}`, colors.red);
    }
  }
  
  log('\n🎯 Test completed!', colors.bright);
  
  // Check if localhost server is running
  const localhostResult = results.localhost;
  if (localhostResult && localhostResult.error && localhostResult.error.includes('ECONNREFUSED')) {
    log('\n⚠️  LOCALHOST SERVER NOT RUNNING', colors.yellow);
    log('To start the localhost server, run:', colors.yellow);
    log('  npm run dev', colors.cyan);
    log('or', colors.yellow);
    log('  npm start', colors.cyan);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    log(`💥 Fatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { runTests, testAuth, testUserProfileAPIs }; 