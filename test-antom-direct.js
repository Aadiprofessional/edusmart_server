const AntomService = require('./src/services/antomService');

async function testAntomDirectly() {
  console.log('🔧 Testing Antom API directly...');
  
  try {
    const antomService = new AntomService();
    
    // Test data similar to what's in documentation
    const paymentData = {
      amount: 10.00,
      currency: 'USD',
      paymentMethodType: 'CARD',
      terminalType: 'WEB',
      orderDescription: 'EduSmart Test Payment',
      userId: 'test-user-123',
      notifyUrl: 'http://localhost:8000/api/antom/notify',
      redirectUrl: 'http://localhost:8000/payment/success'
    };
    
    console.log('Creating payment with:', JSON.stringify(paymentData, null, 2));
    
    const result = await antomService.createPayment(paymentData);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Payment created successfully!');
    } else {
      console.log('❌ Payment creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Direct test error:', error.message);
    console.error('Full error:', error);
  }
}

testAntomDirectly(); 