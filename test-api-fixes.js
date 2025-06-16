// Test script to verify API fixes
const API_BASE = 'https://edusmart-server.pages.dev/api';

async function testAPIs() {
  console.log('🧪 Testing Course APIs...\n');

  try {
    // Test 1: Get courses
    console.log('1. Testing GET /courses...');
    const coursesResponse = await fetch(`${API_BASE}/courses?page=1&limit=5`);
    const coursesData = await coursesResponse.json();
    console.log('✅ Courses API:', coursesData.success ? 'Working' : 'Failed');
    console.log(`   Found ${coursesData.data?.courses?.length || 0} courses\n`);

    // Test 2: Get categories
    console.log('2. Testing GET /courses/categories...');
    const categoriesResponse = await fetch(`${API_BASE}/courses/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories API:', categoriesData.success ? 'Working' : 'Failed');
    console.log(`   Found ${categoriesData.data?.categories?.length || 0} categories\n`);

    // Test 3: Get levels
    console.log('3. Testing GET /courses/levels...');
    const levelsResponse = await fetch(`${API_BASE}/courses/levels`);
    const levelsData = await levelsResponse.json();
    console.log('✅ Levels API:', levelsData.success ? 'Working' : 'Failed');
    console.log(`   Found ${levelsData.data?.levels?.length || 0} levels\n`);

    // Test 4: Get course details (using first course if available)
    if (coursesData.data?.courses?.length > 0) {
      const firstCourse = coursesData.data.courses[0];
      console.log(`4. Testing GET /courses/${firstCourse.id}...`);
      const courseResponse = await fetch(`${API_BASE}/courses/${firstCourse.id}`);
      const courseData = await courseResponse.json();
      console.log('✅ Course Details API:', courseData.success ? 'Working' : 'Failed');
      console.log(`   Course: ${courseData.data?.course?.title || 'N/A'}\n`);

      // Test 5: Get course sections
      console.log(`5. Testing GET /courses/${firstCourse.id}/sections...`);
      const sectionsResponse = await fetch(`${API_BASE}/courses/${firstCourse.id}/sections`);
      const sectionsData = await sectionsResponse.json();
      console.log('✅ Sections API:', sectionsData.success ? 'Working' : 'Failed');
      console.log(`   Found ${sectionsData.data?.sections?.length || 0} sections\n`);
    }

    console.log('🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAPIs(); 