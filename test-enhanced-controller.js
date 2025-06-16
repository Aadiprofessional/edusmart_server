import { getCourses, getCourseCategories } from './src/controllers/enhancedCourseController.js';

// Mock request and response objects
const mockReq = {
  query: {
    page: 1,
    limit: 5
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response Status:', this.statusCode || 200);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function testEnhancedController() {
  console.log('🧪 Testing Enhanced Course Controller Functions\n');
  
  try {
    console.log('1️⃣ Testing getCourses...');
    await getCourses(mockReq, mockRes);
    
    console.log('\n2️⃣ Testing getCourseCategories...');
    await getCourseCategories({ query: {} }, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnhancedController(); 