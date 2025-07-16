const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8000';

// You need to get a real Supabase token from your frontend or create one manually
// For testing, you can either:
// 1. Use a token from your frontend browser dev tools
// 2. Create a test user and get their token
// 3. Use your actual Supabase token

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImxPODhMUkdpWVRTaGxGcHgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2NkcXJteG1xc294bmNua3hpcXd1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ZjIxYzcxNC1hMjU1LTRiYWItODY0ZS1hMzZjNjM0NjZhOTUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyNTMyMzEzLCJpYXQiOjE3NTI1Mjg3MTMsImVtYWlsIjoibWF0cml4YWkuZ2xvYmFsQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtYXRyaXhhaS5nbG9iYWxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJCaWxsIEtvbmciLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjVmMjFjNzE0LWEyNTUtNGJhYi04NjRlLWEzNmM2MzQ2NmE5NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzUyNTI4NzEzfV0sInNlc3Npb25faWQiOiI2YzA4NmZmMy03ODFmLTRlOTQtYjgxNC1iOWRlMzlkNTkwZDEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.VyEeKZ409t5ls-PlhKiM6-0UzuV4uqiZikZKlO8AGvQ'; // Replace with actual Supabase token

// Test user data (this will be extracted from the Supabase token)


// Test functions
async function testRealPaymentFlow() {
  console.log('🧪 TESTING REAL ANTOM PAYMENT FLOW');
  console.log('=' .repeat(50));
  
  const token = TEST_TOKEN;
  
  try {
    // Test 1: Create an addon payment
    console.log('\n1️⃣ Testing Addon Payment Creation');
    console.log('-'.repeat(30));
    
    const addonPaymentData = {
      addonId: 'test-addon-123',
      amount: 9.99,
      currency: 'USD',
      paymentMethodType: 'CARD',
      terminalType: 'WEB',
      orderDescription: 'Test Addon Payment - Real API',
      redirectUrl: `${BASE_URL}/payment/success`,
      notifyUrl: `${BASE_URL}/api/antom/notify`
    };
    
    console.log('📤 Sending addon payment request...');
    const addonResponse = await axios.post(`${BASE_URL}/api/antom/create`, addonPaymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Addon Payment Response:', JSON.stringify(addonResponse.data, null, 2));
    
    if (addonResponse.data.success && addonResponse.data.paymentUrl) {
      console.log('🔗 Payment URL:', addonResponse.data.paymentUrl);
      console.log('💳 You can now test the payment with card: 4054695723100768');
    }
    
    const paymentRequestId = addonResponse.data.paymentRequestId;
    
    // Test 2: Query payment status
    console.log('\n2️⃣ Testing Payment Status Query');
    console.log('-'.repeat(30));
    
    console.log('📤 Querying payment status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/antom/status/${paymentRequestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Payment Status Response:', JSON.stringify(statusResponse.data, null, 2));
    
    // Test 3: Get payment history
    console.log('\n3️⃣ Testing Payment History');
    console.log('-'.repeat(30));
    
    console.log('📤 Getting payment history...');
    const historyResponse = await axios.get(`${BASE_URL}/api/antom/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Payment History Response:', JSON.stringify(historyResponse.data, null, 2));
    
    // Test 4: Test webhook signature verification (simulate)
    console.log('\n4️⃣ Testing Webhook Signature Verification');
    console.log('-'.repeat(30));
    
    const webhookData = {
      paymentRequestId: paymentRequestId,
      paymentStatus: 'SUCCESS',
      paymentId: 'test-payment-123',
      result: {
        resultCode: 'SUCCESS',
        resultMessage: 'Payment completed successfully'
      }
    };
    
    console.log('📤 Simulating webhook notification...');
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/api/antom/notify`, webhookData, {
        headers: {
          'Content-Type': 'application/json',
          'client-id': '5YEX0L302DFU04384',
          'Request-Time': Date.now().toString(),
          'Signature': 'test-signature' // This will fail verification, which is expected
        }
      });
      
      console.log('✅ Webhook Response:', JSON.stringify(webhookResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Webhook failed (expected due to test signature):', error.response?.data);
    }
    
    console.log('\n🎉 REAL PAYMENT FLOW TEST COMPLETED');
    console.log('=' .repeat(50));
    console.log('✅ All tests executed successfully!');
    console.log('💡 Check your server logs for detailed Antom API request/response logs');
    console.log('🔗 If payment URL was generated, you can test it with card: 4054695723100768');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('🔍 Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting Real Antom Payment Flow Test');
  console.log('⚠️  Make sure your server is running on port 8000');
  console.log('⚠️  Make sure TEST_MODE is set to false in antomService.js');
  console.log('');
  
  testRealPaymentFlow().catch(console.error);
}

module.exports = { testRealPaymentFlow }; 