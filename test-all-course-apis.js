import fetch from 'node-fetch';

const BASE_URL = 'https://edusmart-server.pages.dev/api';
const ADMIN_EMAIL = 'matrixai.global@gmail.com';
const ADMIN_PASSWORD = '12345678';

let authToken = null;
let adminUid = null;
let testCourseId = null;
let testSectionId = null;
let testLectureId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const config = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) })
  };
  
  console.log(`\n🔄 ${method} ${BASE_URL}${endpoint}`);
  if (data) console.log('📤 Request data:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      parsedData = responseData;
    }
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📥 Response:', JSON.stringify(parsedData, null, 2));
    
    return {
      success: response.ok,
      status: response.status,
      data: parsedData
    };
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test authentication
async function testAuth() {
  console.log('\n🔐 TESTING AUTHENTICATION');
  console.log('=' .repeat(50));
  
  const result = await apiCall('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  if (result.success && result.data.session) {
    authToken = result.data.session.access_token;
    adminUid = result.data.user.id;
    console.log('✅ Authentication successful');
    console.log('🔑 Token:', authToken ? 'Present' : 'Missing');
    console.log('👤 Admin UID:', adminUid);
    return true;
  } else {
    console.log('❌ Authentication failed');
    return false;
  }
}

// Test course management
async function testCourseManagement() {
  console.log('\n📚 TESTING COURSE MANAGEMENT');
  console.log('=' .repeat(50));
  
  // 1. Get all courses
  console.log('\n1️⃣ Testing GET /courses');
  const coursesResult = await apiCall('GET', '/courses?page=1&limit=5');
  
  // 2. Get course categories
  console.log('\n2️⃣ Testing GET /courses/categories');
  const categoriesResult = await apiCall('GET', '/courses/categories');
  
  // 3. Get course levels
  console.log('\n3️⃣ Testing GET /courses/levels');
  const levelsResult = await apiCall('GET', '/courses/levels');
  
  // 4. Create a test course
  console.log('\n4️⃣ Testing POST /courses (Create Course)');
  const courseData = {
    uid: adminUid,
    title: 'Test Course API',
    description: 'This is a test course created via API',
    category: 'Technology',
    level: 'beginner',
    language: 'English',
    price: 99.99,
    instructor_name: 'Test Instructor',
    status: 'published',
    featured: false
  };
  
  const createResult = await apiCall('POST', '/courses', courseData, true);
  
  if (createResult.success && createResult.data.course?.id) {
    testCourseId = createResult.data.course.id;
    console.log('✅ Course created with ID:', testCourseId);
  }
  
  // 5. Get course by ID
  if (testCourseId) {
    console.log('\n5️⃣ Testing GET /courses/:id');
    await apiCall('GET', `/courses/${testCourseId}`);
  }
  
  // 6. Update course
  if (testCourseId) {
    console.log('\n6️⃣ Testing PUT /courses/:id (Update Course)');
    const updateData = {
      uid: adminUid,
      title: 'Updated Test Course API',
      description: 'This course has been updated via API'
    };
    await apiCall('PUT', `/courses/${testCourseId}`, updateData, true);
  }
}

// Test course sections
async function testCourseSections() {
  if (!testCourseId) {
    console.log('\n⚠️ Skipping section tests - no test course available');
    return;
  }
  
  console.log('\n📖 TESTING COURSE SECTIONS');
  console.log('=' .repeat(50));
  
  // 1. Create a section
  console.log('\n1️⃣ Testing POST /courses/:courseId/sections');
  const sectionData = {
    uid: adminUid,
    title: 'Test Section 1',
    description: 'This is a test section',
    section_order: 1
  };
  
  const sectionResult = await apiCall('POST', `/courses/${testCourseId}/sections`, sectionData, true);
  
  if (sectionResult.success && sectionResult.data.section?.id) {
    testSectionId = sectionResult.data.section.id;
    console.log('✅ Section created with ID:', testSectionId);
  }
  
  // 2. Get course sections
  console.log('\n2️⃣ Testing GET /courses/:courseId/sections');
  await apiCall('GET', `/courses/${testCourseId}/sections?uid=${adminUid}`);
  
  // 3. Update section
  if (testSectionId) {
    console.log('\n3️⃣ Testing PUT /sections/:sectionId');
    const updateSectionData = {
      uid: adminUid,
      title: 'Updated Test Section 1',
      description: 'This section has been updated'
    };
    await apiCall('PUT', `/sections/${testSectionId}`, updateSectionData, true);
  }
}

// Test course lectures
async function testCourseLectures() {
  if (!testSectionId) {
    console.log('\n⚠️ Skipping lecture tests - no test section available');
    return;
  }
  
  console.log('\n🎥 TESTING COURSE LECTURES');
  console.log('=' .repeat(50));
  
  // 1. Create a lecture
  console.log('\n1️⃣ Testing POST /sections/:sectionId/lectures');
  const lectureData = {
    uid: adminUid,
    title: 'Test Lecture 1',
    description: 'This is a test lecture',
    lecture_type: 'video',
    video_url: 'https://example.com/video.mp4',
    video_duration_seconds: 600,
    lecture_order: 1,
    is_preview: true,
    is_free: true
  };
  
  const lectureResult = await apiCall('POST', `/sections/${testSectionId}/lectures`, lectureData, true);
  
  if (lectureResult.success && lectureResult.data.lecture?.id) {
    testLectureId = lectureResult.data.lecture.id;
    console.log('✅ Lecture created with ID:', testLectureId);
  }
  
  // 2. Update lecture
  if (testLectureId) {
    console.log('\n2️⃣ Testing PUT /lectures/:lectureId');
    const updateLectureData = {
      uid: adminUid,
      title: 'Updated Test Lecture 1',
      description: 'This lecture has been updated'
    };
    await apiCall('PUT', `/lectures/${testLectureId}`, updateLectureData, true);
  }
}

// Test enrollment
async function testEnrollment() {
  if (!testCourseId) {
    console.log('\n⚠️ Skipping enrollment tests - no test course available');
    return;
  }
  
  console.log('\n🎓 TESTING COURSE ENROLLMENT');
  console.log('=' .repeat(50));
  
  // 1. Test enrollment
  console.log('\n1️⃣ Testing POST /courses/:courseId/enroll');
  const enrollmentData = {
    userId: adminUid,
    pricePaid: 0,
    paymentMethod: 'free',
    transactionId: 'test_' + Date.now()
  };
  
  await apiCall('POST', `/courses/${testCourseId}/enroll`, enrollmentData);
  
  // 2. Check enrollment status
  console.log('\n2️⃣ Testing GET /courses/:courseId/enrollment/:userId');
  await apiCall('GET', `/courses/${testCourseId}/enrollment/${adminUid}`);
  
  // 3. Get user enrollments
  console.log('\n3️⃣ Testing GET /users/:userId/enrollments');
  await apiCall('GET', `/users/${adminUid}/enrollments`);
  
  // 4. Get course sections as enrolled user
  console.log('\n4️⃣ Testing GET /courses/:courseId/sections (as enrolled user)');
  await apiCall('GET', `/courses/${testCourseId}/sections?uid=${adminUid}`);
}

// Test course reviews
async function testCourseReviews() {
  if (!testCourseId) {
    console.log('\n⚠️ Skipping review tests - no test course available');
    return;
  }
  
  console.log('\n⭐ TESTING COURSE REVIEWS');
  console.log('=' .repeat(50));
  
  // 1. Create a review
  console.log('\n1️⃣ Testing POST /courses/:courseId/reviews');
  const reviewData = {
    userId: adminUid,
    rating: 5,
    title: 'Great course!',
    comment: 'This is an excellent course for beginners.'
  };
  
  await apiCall('POST', `/courses/${testCourseId}/reviews`, reviewData);
  
  // 2. Get course reviews
  console.log('\n2️⃣ Testing GET /courses/:courseId/reviews');
  await apiCall('GET', `/courses/${testCourseId}/reviews`);
}

// Cleanup test data
async function cleanup() {
  console.log('\n🧹 CLEANING UP TEST DATA');
  console.log('=' .repeat(50));
  
  // Delete lecture
  if (testLectureId) {
    console.log('\n🗑️ Deleting test lecture');
    await apiCall('DELETE', `/lectures/${testLectureId}`, { uid: adminUid }, true);
  }
  
  // Delete section
  if (testSectionId) {
    console.log('\n🗑️ Deleting test section');
    await apiCall('DELETE', `/sections/${testSectionId}`, { uid: adminUid }, true);
  }
  
  // Delete course
  if (testCourseId) {
    console.log('\n🗑️ Deleting test course');
    await apiCall('DELETE', `/courses/${testCourseId}`, { uid: adminUid }, true);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE COURSE API TESTS');
  console.log('=' .repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Email: ${ADMIN_EMAIL}`);
  
  try {
    // Test authentication first
    const authSuccess = await testAuth();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
      return;
    }
    
    // Run all tests
    await testCourseManagement();
    await testCourseSections();
    await testCourseLectures();
    await testEnrollment();
    await testCourseReviews();
    
    // Cleanup
    await cleanup();
    
    console.log('\n✅ ALL TESTS COMPLETED');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run the tests
runAllTests(); 