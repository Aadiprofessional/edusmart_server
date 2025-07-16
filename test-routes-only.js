const https = require('https');

const BASE_URL = 'https://edusmart-api-edusmar-service-naewilylpd.cn-hangzhou.fcapp.run';

// Simple route tests - just check if routes exist
const routeTests = [
  '/api/auth',
  '/api/blogs', 
  '/api/courses',
  '/api/v2/courses',
  '/api/case-studies',
  '/api/responses',
  '/api/scholarships',
  '/api/users',
  '/api/user',
  '/api/universities',
  '/api/uploads',
  '/api/subscriptions',
  '/api/featured',
  '/api/homework',
  '/api/mistake-checks',
  '/api/flashcards',
  '/api/content-writer',
  '/api/study-planner'
];

function testRoute(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const req = https.get(url, (res) => {
      resolve({
        path,
        status: res.statusCode,
        exists: res.statusCode !== 404
      });
    });
    
    req.on('error', () => {
      resolve({
        path,
        status: 'ERROR',
        exists: false
      });
    });
  });
}

async function testAllRoutes() {
  console.log('🧪 Testing Route Availability\n');
  
  const results = await Promise.all(routeTests.map(testRoute));
  
  const working = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);
  
  console.log('✅ WORKING ROUTES:');
  working.forEach(r => console.log(`   ${r.path} (${r.status})`));
  
  console.log('\n❌ MISSING ROUTES:');
  missing.forEach(r => console.log(`   ${r.path} (${r.status})`));
  
  console.log(`\n📊 Summary: ${working.length}/${routeTests.length} routes working`);
}

testAllRoutes().catch(console.error); 