import fetch from 'node-fetch';

const API_BASE = 'https://edusmart-server.pages.dev/api';

// Test admin credentials
const ADMIN_EMAIL = 'matrixai.global@gmail.com';
const ADMIN_PASSWORD = '12345678';

async function testAdminFixes() {
  console.log('🚀 Testing Admin Panel API Fixes...\n');
  
  try {
    // 1. Test Authentication
    console.log('1. Testing Authentication...');
    const authResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    const authData = await authResponse.json();
    if (!authData.success) {
      throw new Error(`Authentication failed: ${authData.error}`);
    }
    
    const token = authData.data.session.access_token;
    const adminUid = authData.data.user.id;
    console.log('✅ Authentication successful');
    console.log(`   Admin UID: ${adminUid}`);
    
    // 2. Test Categories API
    console.log('\n2. Testing Categories API...');
    const categoriesResponse = await fetch(`${API_BASE}/courses/categories`);
    const categoriesData = await categoriesResponse.json();
    
    if (categoriesData.success && categoriesData.data.categories) {
      console.log('✅ Categories API working');
      console.log(`   Found ${categoriesData.data.categories.length} categories`);
      console.log(`   Sample category:`, categoriesData.data.categories[0]);
    } else {
      console.log('❌ Categories API failed:', categoriesData);
    }
    
    // 3. Test Section Creation API
    console.log('\n3. Testing Section Creation API...');
    
    // First get a course to create section for
    const coursesResponse = await fetch(`${API_BASE}/courses?limit=1`);
    const coursesData = await coursesResponse.json();
    
    if (!coursesData.success || !coursesData.data.courses.length) {
      console.log('❌ No courses found to test section creation');
      return;
    }
    
    const testCourse = coursesData.data.courses[0];
    console.log(`   Using course: ${testCourse.title} (${testCourse.id})`);
    
    // Test section creation
    const sectionData = {
      course_id: testCourse.id,
      title: 'Test Section - Admin Panel Fix',
      description: 'Testing section creation from admin panel',
      section_order: 999,
      uid: adminUid
    };
    
    const sectionResponse = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sectionData)
    });
    
    const sectionResult = await sectionResponse.json();
    
    if (sectionResult.success) {
      console.log('✅ Section creation API working');
      console.log(`   Created section: ${sectionResult.data.section.title}`);
      
      // Clean up - delete the test section
      const deleteResponse = await fetch(`${API_BASE}/sections/${sectionResult.data.section.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: adminUid })
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test section cleaned up successfully');
      }
    } else {
      console.log('❌ Section creation failed:', sectionResult);
    }
    
    // 4. Test Lecture Creation API
    console.log('\n4. Testing Lecture Creation API...');
    
    // Get course sections to test lecture creation
    const sectionsResponse = await fetch(`${API_BASE}/courses/${testCourse.id}/sections?uid=${adminUid}`);
    const sectionsData = await sectionsResponse.json();
    
    if (sectionsData.success && sectionsData.data.sections.length > 0) {
      const testSection = sectionsData.data.sections[0];
      console.log(`   Using section: ${testSection.title} (${testSection.id})`);
      
      const lectureData = {
        section_id: testSection.id,
        title: 'Test Lecture - Admin Panel Fix',
        description: 'Testing lecture creation from admin panel',
        lecture_type: 'video',
        video_url: 'https://example.com/test-video.mp4',
        video_duration_seconds: 300,
        lecture_order: 999,
        is_preview: false,
        is_free: false,
        uid: adminUid
      };
      
      const lectureResponse = await fetch(`${API_BASE}/lectures`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lectureData)
      });
      
      const lectureResult = await lectureResponse.json();
      
      if (lectureResult.success) {
        console.log('✅ Lecture creation API working');
        console.log(`   Created lecture: ${lectureResult.data.lecture.title}`);
        
        // Clean up - delete the test lecture
        const deleteLectureResponse = await fetch(`${API_BASE}/lectures/${lectureResult.data.lecture.id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uid: adminUid })
        });
        
        if (deleteLectureResponse.ok) {
          console.log('✅ Test lecture cleaned up successfully');
        }
      } else {
        console.log('❌ Lecture creation failed:', lectureResult);
      }
    } else {
      console.log('❌ No sections found to test lecture creation');
    }
    
    console.log('\n🎉 Admin Panel API Fixes Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminFixes(); 