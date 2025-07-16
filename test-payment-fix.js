const AntomPaymentService = require('./src/services/antomPaymentService');

async function testPaymentCreation() {
  console.log('🧪 Testing Payment Creation with Fixed Antom Integration');
  console.log('=' .repeat(60));
  
  const antomService = new AntomPaymentService();
  
  // Test 1: GCash Payment
  console.log('\n1️⃣ Testing GCash Payment Creation');
  console.log('-'.repeat(40));
  
  const gcashPaymentData = {
    amount: 4.99,
    currency: 'PHP',
    paymentMethodType: 'GCASH',
    orderDescription: 'Test GCash Payment - Extra Responses',
    userId: 'test-user-123',
    notifyUrl: 'https://edusmart-api-edusmar-service-naewilylpd.cn-hangzhou.fcapp.run/api/payment/notify',
    redirectUrl: 'https://edusmart.com/payment/success'
  };
  
  try {
    const gcashResult = await antomService.createPayment(gcashPaymentData);
    
    if (gcashResult.success) {
      console.log('✅ GCash Payment Created Successfully!');
      console.log('💳 Payment Request ID:', gcashResult.paymentRequestId);
      console.log('🔗 Payment URL:', gcashResult.data.normalUrl);
      console.log('📱 QR Code Available:', gcashResult.data.orderCodeForm ? 'Yes' : 'No');
      console.log('💰 Amount:', gcashResult.data.paymentAmount.value, gcashResult.data.paymentAmount.currency);
      
      if (gcashResult.data.orderCodeForm) {
        console.log('🎯 QR Code URLs:');
        gcashResult.data.orderCodeForm.codeDetails.forEach((code, index) => {
          console.log(`   ${index + 1}. ${code.displayType}: ${code.codeValue.substring(0, 80)}...`);
        });
      }
    } else {
      console.log('❌ GCash Payment Failed:', gcashResult.error);
    }
  } catch (error) {
    console.log('❌ GCash Payment Error:', error.message);
  }
  
  // Test 2: Card Payment
  console.log('\n2️⃣ Testing Card Payment Creation');
  console.log('-'.repeat(40));
  
  const cardPaymentData = {
    amount: 9.99,
    currency: 'USD',
    paymentMethodType: 'CARD',
    orderDescription: 'Test Card Payment - Pro Subscription',
    userId: 'test-user-456',
    notifyUrl: 'https://edusmart-api-edusmar-service-naewilylpd.cn-hangzhou.fcapp.run/api/payment/notify',
    redirectUrl: 'https://edusmart.com/payment/success'
  };
  
  try {
    const cardResult = await antomService.createPayment(cardPaymentData);
    
    if (cardResult.success) {
      console.log('✅ Card Payment Created Successfully!');
      console.log('💳 Payment Request ID:', cardResult.paymentRequestId);
      console.log('🔗 Payment URL:', cardResult.data.normalUrl);
      console.log('💰 Amount:', cardResult.data.paymentAmount.value, cardResult.data.paymentAmount.currency);
      console.log('🎯 Redirect URL:', cardResult.data.redirectActionForm?.redirectUrl);
    } else {
      console.log('❌ Card Payment Failed:', cardResult.error);
    }
  } catch (error) {
    console.log('❌ Card Payment Error:', error.message);
  }
  
  // Test 3: Query Payment Status
  console.log('\n3️⃣ Testing Payment Status Query');
  console.log('-'.repeat(40));
  
  try {
    const queryResult = await antomService.queryPayment('REQUEST_1752545077222');
    
    if (queryResult.success) {
      console.log('✅ Payment Status Retrieved Successfully!');
      console.log('📊 Status:', queryResult.data.result?.resultStatus);
      console.log('🔍 Result Code:', queryResult.data.result?.resultCode);
      console.log('💬 Message:', queryResult.data.result?.resultMessage);
    } else {
      console.log('❌ Payment Status Query Failed:', queryResult.error);
    }
  } catch (error) {
    console.log('❌ Payment Status Query Error:', error.message);
  }
  
  console.log('\n🎉 Payment Integration Test Complete!');
  console.log('=' .repeat(60));
}

testPaymentCreation().catch(console.error); 