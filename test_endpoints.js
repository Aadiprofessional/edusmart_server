const axios = require('axios');

const BASE_URL = 'https://edusmart-server.vercel.app';

async function testEndpoints() {
  console.log('🚀 Testing EduSmart API Endpoints...\n');

  const endpoints = [
    { name: 'Root', url: '/' },
    { name: 'Blogs', url: '/api/blogs' },
    { name: 'Courses', url: '/api/courses' },
    { name: 'Case Studies', url: '/api/case-studies' },
    { name: 'Responses', url: '/api/responses' },
    { name: 'Scholarships', url: '/api/scholarships' },
    { name: 'Universities', url: '/api/universities' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status} - ${response.statusText}`);
      
      // Log some data info for verification
      if (response.data) {
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
        if (response.data.endpoints) {
          console.log(`   Available endpoints: ${Object.keys(response.data.endpoints).join(', ')}`);
        }
        if (response.data.blogs) {
          console.log(`   Blogs found: ${response.data.blogs.length}`);
        }
        if (response.data.courses) {
          console.log(`   Courses found: ${response.data.courses.length}`);
        }
        if (response.data.caseStudies) {
          console.log(`   Case Studies found: ${response.data.caseStudies.length}`);
        }
        if (response.data.responses) {
          console.log(`   Responses found: ${response.data.responses.length}`);
        }
        if (response.data.scholarships) {
          console.log(`   Scholarships found: ${response.data.scholarships.length}`);
        }
        if (response.data.universities) {
          console.log(`   Universities found: ${response.data.universities.length}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Network Error'} - ${error.response?.statusText || error.message}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Testing complete!');
}

testEndpoints().catch(console.error); 