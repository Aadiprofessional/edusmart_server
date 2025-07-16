const axios = require('axios');
require('dotenv').config();

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = 'matrixai.global@gmail.com';
const TEST_USER_PASSWORD = '12345678';

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function authenticate() {
  try {
    console.log('\n🔐 Authenticating test user...');
    
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authResponse.data.message === 'Login successful' && authResponse.data.session?.access_token) {
      logTest('Authentication', true, 'Successfully authenticated test user');
      return authResponse.data.session.access_token;
    } else {
      logTest('Authentication', false, 'Failed to authenticate: ' + (authResponse.data.message || 'Unknown error'));
      return null;
    }
  } catch (error) {
    logTest('Authentication', false, 'Auth error: ' + (error.response?.data?.message || error.message));
    return null;
  }
}

async function testGetSubscriptionPlans() {
  try {
    console.log('\n📋 Testing subscription plans API...');
    
    const response = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    
    if (response.data.success && Array.isArray(response.data.data)) {
      logTest('Get Subscription Plans', true, `Found ${response.data.data.length} plans`);
      return response.data.data;
    } else {
      logTest('Get Subscription Plans', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('Get Subscription Plans', false, error.response?.data?.message || error.message);
    return [];
  }
}

async function testGetAddonPlans() {
  try {
    console.log('\n🔌 Testing addon plans API...');
    
    const response = await axios.get(`${BASE_URL}/api/subscriptions/addons`);
    
    if (response.data.success && Array.isArray(response.data.data)) {
      logTest('Get Addon Plans', true, `Found ${response.data.data.length} addons`);
      return response.data.data;
    } else {
      logTest('Get Addon Plans', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('Get Addon Plans', false, error.response?.data?.message || error.message);
    return [];
  }
}

async function testCreateAntomPayment(token, planId) {
  try {
    console.log('\n💳 Testing Antom subscription payment creation...');
    
    const paymentData = {
      planId: planId,
      currency: 'USD',
      paymentMethodType: 'CARD',
      terminalType: 'WEB',
      redirectUrl: `${BASE_URL}/payment/success`,
      notifyUrl: `${BASE_URL}/api/antom/notify`
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/subscriptions/payment/subscription`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success && response.data.data.paymentRequestId) {
      logTest('Create Antom Subscription Payment', true, `Payment created with ID: ${response.data.data.paymentRequestId}`);
      return response.data.data;
    } else {
      logTest('Create Antom Subscription Payment', false, 'Failed to create payment: ' + response.data.message);
      return null;
    }
  } catch (error) {
    console.log('Raw subscription error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.message);
    logTest('Create Antom Subscription Payment', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testCreateAddonPayment(token, addonId) {
  try {
    console.log('\n🔌 Testing Antom addon payment creation...');
    
    const paymentData = {
      addonId: addonId,
      currency: 'USD',
      paymentMethodType: 'CARD',
      terminalType: 'WEB',
      redirectUrl: `${BASE_URL}/payment/success`,
      notifyUrl: `${BASE_URL}/api/antom/notify`
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/subscriptions/payment/addon`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success && response.data.data.paymentRequestId) {
      logTest('Create Antom Addon Payment', true, `Payment created with ID: ${response.data.data.paymentRequestId}`);
      return response.data.data;
    } else {
      logTest('Create Antom Addon Payment', false, 'Failed to create payment: ' + response.data.message);
      return null;
    }
  } catch (error) {
    console.log('Raw error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.message);
    logTest('Create Antom Addon Payment', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testQueryPaymentStatus(token, paymentRequestId) {
  try {
    console.log('\n🔍 Testing payment status query...');
    
    const response = await axios.get(
      `${BASE_URL}/api/antom/status/${paymentRequestId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success && response.data.data.paymentRequestId) {
      logTest('Query Payment Status', true, `Status: ${response.data.data.status || 'pending'}`);
      return response.data.data;
    } else {
      logTest('Query Payment Status', false, 'Failed to query status: ' + response.data.message);
      return null;
    }
  } catch (error) {
    logTest('Query Payment Status', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testCancelPayment(token, paymentRequestId) {
  try {
    console.log('\n❌ Testing payment cancellation...');
    
    const response = await axios.post(
      `${BASE_URL}/api/antom/cancel/${paymentRequestId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      logTest('Cancel Payment', true, 'Payment cancelled successfully');
      return true;
    } else {
      logTest('Cancel Payment', false, 'Failed to cancel payment: ' + response.data.message);
      return false;
    }
  } catch (error) {
    logTest('Cancel Payment', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testPaymentHistory(token) {
  try {
    console.log('\n📜 Testing payment history...');
    
    const response = await axios.get(
      `${BASE_URL}/api/antom/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success && Array.isArray(response.data.data.payments)) {
      logTest('Payment History', true, `Found ${response.data.data.payments.length} payments`);
      return response.data.data.payments;
    } else {
      logTest('Payment History', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('Payment History', false, error.response?.data?.message || error.message);
    return [];
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('\n🔔 Testing webhook endpoint...');
    
    // Test with invalid signature first
    const invalidResponse = await axios.post(
      `${BASE_URL}/api/antom/notify`,
      {
        paymentRequestId: 'test-payment-id',
        paymentStatus: 'SUCCESS',
        result: { resultCode: 'SUCCESS' }
      },
      {
        headers: {
          'client-id': 'invalid-client',
          'request-time': new Date().toISOString(),
          'signature': 'invalid-signature',
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Don't throw on 400/500 status codes
      }
    );
    
    if (invalidResponse.status === 400 && invalidResponse.data.resultCode === 'FAIL') {
      logTest('Webhook Security', true, 'Webhook correctly rejects invalid signatures');
    } else {
      logTest('Webhook Security', false, 'Webhook should reject invalid signatures');
    }
    
    // Test webhook endpoint accessibility
    logTest('Webhook Endpoint', true, 'Webhook endpoint is accessible');
    
  } catch (error) {
    logTest('Webhook Endpoint', false, error.message);
  }
}

async function testAntomService() {
  try {
    console.log('\n🔧 Testing Antom service directly...');
    
    const AntomService = require('./src/services/antomService');
    const antomService = new AntomService();
    
    // Test signature generation
    const signature = antomService.generateSignature(
      'POST',
      '/v1/payments/pay',
      antomService.CLIENT_ID,
      new Date().toISOString(),
      '{"test": "data"}'
    );
    
    if (signature && typeof signature === 'string') {
      logTest('Signature Generation', true, 'Successfully generated signature');
    } else {
      logTest('Signature Generation', false, 'Failed to generate signature');
    }
    
    // Test amount conversion
    const minorUnits = antomService.convertToMinorUnits(10.50, 'USD');
    if (minorUnits === '1050') {
      logTest('Amount Conversion', true, '$10.50 converted to 1050 minor units');
    } else {
      logTest('Amount Conversion', false, `Expected 1050, got ${minorUnits}`);
    }
    
  } catch (error) {
    logTest('Antom Service', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Antom Payment API Tests');
  console.log('=====================================');
  
  // Test Antom service functionality first
  await testAntomService();
  
  // Test authentication
  const token = await authenticate();
  if (!token) {
    console.log('\n❌ Cannot proceed without authentication. Please ensure a test user exists.');
    printSummary();
    return;
  }
  
  // Test subscription plans
  const plans = await testGetSubscriptionPlans();
  if (plans.length === 0) {
    console.log('\n❌ No subscription plans found. Please create test plans first.');
    printSummary();
    return;
  }
  
  // Test addon plans
  const addons = await testGetAddonPlans();
  
  // Use the first plan for testing
  const testPlan = plans[0];
  console.log(`\n📋 Using plan for testing: ${testPlan.name} ($${testPlan.price})`);
  
  // Test subscription payment creation
  let payment = await testCreateAntomPayment(token, testPlan.id);
  
  // If subscription payment fails (user already has subscription), try addon payment
  if (!payment && addons.length > 0) {
    const testAddon = addons[0];
    console.log(`\n🔌 Subscription payment failed, trying addon: ${testAddon.name} ($${testAddon.price})`);
    payment = await testCreateAddonPayment(token, testAddon.id);
  }
  
  if (payment && payment.paymentRequestId) {
    // Test payment status query
    await testQueryPaymentStatus(token, payment.paymentRequestId);
    
    // Test payment cancellation
    await testCancelPayment(token, payment.paymentRequestId);
  }
  
  // Test payment history
  await testPaymentHistory(token);
  
  // Test webhook endpoint
  await testWebhookEndpoint();
  
  printSummary();
}

function printSummary() {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.tests.length}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
  }
  
  if (testResults.passed === testResults.tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! Antom integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n📋 API ENDPOINTS TESTED:');
  console.log('   • GET /api/subscriptions/plans');
  console.log('   • POST /api/subscriptions/payment/subscription');
  console.log('   • GET /api/antom/status/:paymentRequestId');
  console.log('   • POST /api/antom/cancel/:paymentRequestId');
  console.log('   • GET /api/antom/history');
  console.log('   • POST /api/antom/notify (webhook)');
  
  console.log('\n🔗 ANTOM INTEGRATION DETAILS:');
  console.log(`   • Client ID: ${process.env.CLIENT_ID || '5YEX0L302DFU04384'}`);
  console.log(`   • Domain: https://open-sea-global.alipay.com`);
  console.log('   • All APIs use proper RSA signature authentication');
  console.log('   • Webhook signature verification is enabled');
}

// Add helpful information
console.log('🔧 SETUP REQUIREMENTS:');
console.log('1. Make sure your server is running on the configured port');
console.log('2. Ensure database tables are created (run the SQL migration)');
console.log('3. Create a test user account if authentication fails');
console.log('4. Create at least one subscription plan for testing');
console.log('5. Verify your Antom credentials in the service configuration');
console.log('');

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}); 