const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8000';

// Use your actual Supabase token
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImxPODhMUkdpWVRTaGxGcHgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2NkcXJteG1xc294bmNua3hpcXd1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ZjIxYzcxNC1hMjU1LTRiYWItODY0ZS1hMzZjNjM0NjZhOTUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyNTMyMzEzLCJpYXQiOjE3NTI1Mjg3MTMsImVtYWlsIjoibWF0cml4YWkuZ2xvYmFsQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtYXRyaXhhaS5nbG9iYWxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJCaWxsIEtvbmciLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjVmMjFjNzE0LWEyNTUtNGJhYi04NjRlLWEzNmM2MzQ2NmE5NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzUyNTI4NzEzfV0sInNlc3Npb25faWQiOiI2YzA4NmZmMy03ODFmLTRlOTQtYjgxNC1iOWRlMzlkNTkwZDEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.VyEeKZ409t5ls-PlhKiM6-0UzuV4uqiZikZKlO8AGvQ';

// Test functions
async function testDirectPayment() {
  console.log('🧪 TESTING DIRECT ANTOM PAYMENT');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Create a direct payment (no addon/subscription validation)
    console.log('\n1️⃣ Testing Direct Payment Creation');
    console.log('-'.repeat(30));
    
    const paymentData = {
      amount: 19.99,
      currency: 'USD',
      paymentMethodType: 'CARD',
      terminalType: 'WEB',
      orderDescription: 'Test Direct Payment - Real Antom API',
      redirectUrl: `${BASE_URL}/payment/success`,
      notifyUrl: `${BASE_URL}/api/antom/notify`
    };
    
    console.log('📤 Sending direct payment request...');
    console.log('📋 Payment Data:', JSON.stringify(paymentData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/antom/create`, paymentData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Payment Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 SUCCESS! Payment created successfully');
      console.log('💳 Payment Request ID:', response.data.paymentRequestId);
      console.log('🔗 Payment URL:', response.data.paymentUrl || response.data.data?.normalUrl);
      console.log('💰 Amount:', response.data.amount || paymentData.amount, response.data.currency || paymentData.currency);
      
      if (response.data.paymentUrl || response.data.data?.normalUrl) {
        console.log('\n🔗 PAYMENT URL GENERATED!');
        console.log('You can now test the payment with the Antom test card: 4054695723100768');
        console.log('Payment URL:', response.data.paymentUrl || response.data.data?.normalUrl);
      }
      
      // Test 2: Query payment status
      const paymentRequestId = response.data.paymentRequestId;
      if (paymentRequestId) {
        console.log('\n2️⃣ Testing Payment Status Query');
        console.log('-'.repeat(30));
        
        console.log('📤 Querying payment status...');
        const statusResponse = await axios.get(`${BASE_URL}/api/antom/status/${paymentRequestId}`, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        });
        
        console.log('✅ Payment Status Response:', JSON.stringify(statusResponse.data, null, 2));
      }
    } else {
      console.log('❌ Payment creation failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('🔍 Error Status:', error.response?.status);
    console.error('🔍 Error Details:', error.response?.data);
  }
}

// Test payment history
async function testPaymentHistory() {
  console.log('\n3️⃣ Testing Payment History');
  console.log('-'.repeat(30));
  
  try {
    console.log('📤 Getting payment history...');
    const historyResponse = await axios.get(`${BASE_URL}/api/antom/history`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Payment History Response:', JSON.stringify(historyResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Payment history failed:', error.response?.data || error.message);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Direct Antom Payment Test');
  console.log('⚠️  Make sure your server is running on port 8000');
  console.log('⚠️  Make sure TEST_MODE is set to false in antomService.js');
  console.log('');
  
  await testDirectPayment();
  await testPaymentHistory();
  
  console.log('\n🎉 TEST COMPLETED');
  console.log('=' .repeat(50));
  console.log('💡 Check your server logs for detailed Antom API request/response logs');
  console.log('💡 Check the Antom dashboard for request logs');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testDirectPayment, testPaymentHistory }; 