const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v2';

// Test data
const testCourse = {
  title: 'Complete React Development Course',
  subtitle: 'Master React from beginner to advanced level',
  description: 'Learn React.js from scratch and build amazing web applications. This comprehensive course covers everything from basic concepts to advanced patterns and best practices. You will master React hooks, state management, component lifecycle, routing, and much more.',
  category: 'programming',
  level: 'intermediate',
  language: 'English',
  duration: '25 hours',
  price: 99.99,
  original_price: 149.99,
  thumbnail_image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500',
  instructor_name: 'John Doe',
  instructor_bio: 'Senior React Developer with 8+ years of experience',
  what_you_will_learn: [
    'Build modern React applications',
    'Understand React hooks and state management',
    'Create reusable components',
    'Implement routing and navigation'
  ],
  prerequisites: ['Basic JavaScript knowledge', 'HTML/CSS fundamentals'],
  target_audience: ['Beginner developers', 'Frontend developers', 'JavaScript developers'],
  course_includes: ['25 hours of video', 'Downloadable resources', 'Certificate of completion'],
  tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
  status: 'published',
  featured: true,
  uid: '5f21c714-a255-4bab-864e-a36c63466a95' // Using existing admin UID (Bill Kong)
};

const testSection = {
  title: 'Getting Started with React',
  description: 'Introduction to React fundamentals',
  section_order: 1
};

const testLecture = {
  title: 'What is React?',
  description: 'Understanding React and its core concepts',
  lecture_type: 'video',
  video_duration_seconds: 600,
  lecture_order: 1,
  is_preview: true
};

async function testAPIs() {
  try {
    console.log('🚀 Testing Enhanced Course APIs...\n');

    // Test 1: Get course categories
    console.log('1. Testing GET /course-categories');
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/course-categories`);
      console.log('✅ Categories fetched successfully');
      console.log(`   Found ${categoriesResponse.data.data.categories.length} categories\n`);
    } catch (error) {
      console.log('❌ Categories test failed:', error.response?.data || error.message);
    }

    // Test 2: Create a course
    console.log('2. Testing POST /courses (Create Course)');
    let courseId;
    try {
      const createResponse = await axios.post(`${BASE_URL}/courses`, testCourse);
      courseId = createResponse.data.data.course.id;
      console.log('✅ Course created successfully');
      console.log(`   Course ID: ${courseId}\n`);
    } catch (error) {
      console.log('❌ Course creation failed:', error.response?.data || error.message);
      return;
    }

    // Test 3: Get all courses
    console.log('3. Testing GET /courses');
    try {
      const coursesResponse = await axios.get(`${BASE_URL}/courses`);
      console.log('✅ Courses fetched successfully');
      console.log(`   Found ${coursesResponse.data.data.courses.length} courses\n`);
    } catch (error) {
      console.log('❌ Get courses failed:', error.response?.data || error.message);
    }

    // Test 4: Get course by ID
    console.log('4. Testing GET /courses/:id');
    try {
      const courseResponse = await axios.get(`${BASE_URL}/courses/${courseId}`);
      console.log('✅ Course details fetched successfully');
      console.log(`   Course: ${courseResponse.data.data.course.title}\n`);
    } catch (error) {
      console.log('❌ Get course by ID failed:', error.response?.data || error.message);
    }

    // Test 5: Create a section
    console.log('5. Testing POST /courses/:courseId/sections');
    let sectionId;
    try {
      const sectionData = {
        ...testSection,
        uid: '5f21c714-a255-4bab-864e-a36c63466a95' // Add admin UID
      };
      const sectionResponse = await axios.post(`${BASE_URL}/courses/${courseId}/sections`, sectionData);
      sectionId = sectionResponse.data.data.section.id;
      console.log('✅ Section created successfully');
      console.log(`   Section ID: ${sectionId}\n`);
    } catch (error) {
      console.log('❌ Section creation failed:', error.response?.data || error.message);
    }

    // Test 6: Create a lecture
    if (sectionId) {
      console.log('6. Testing POST /sections/:sectionId/lectures');
      try {
        const lectureData = {
          ...testLecture,
          uid: '5f21c714-a255-4bab-864e-a36c63466a95' // Add admin UID
        };
        const lectureResponse = await axios.post(`${BASE_URL}/sections/${sectionId}/lectures`, lectureData);
        console.log('✅ Lecture created successfully');
        console.log(`   Lecture ID: ${lectureResponse.data.data.lecture.id}\n`);
      } catch (error) {
        console.log('❌ Lecture creation failed:', error.response?.data || error.message);
      }
    }

    // Test 7: Get course sections
    console.log('7. Testing GET /courses/:courseId/sections');
    try {
      const sectionsResponse = await axios.get(`${BASE_URL}/courses/${courseId}/sections?uid=5f21c714-a255-4bab-864e-a36c63466a95`);
      console.log('✅ Course sections fetched successfully');
      console.log(`   Found ${sectionsResponse.data.data.sections.length} sections\n`);
    } catch (error) {
      console.log('❌ Get sections failed:', error.response?.data || error.message);
    }

    // Test 8: Test enrollment (simulate)
    console.log('8. Testing POST /courses/:courseId/enroll');
    try {
      const enrollmentData = {
        userId: 'b846c59e-7422-4be3-a4f6-dd20145e8400', // Using existing user ID (Aadi)
        pricePaid: 99.99,
        paymentMethod: 'credit_card',
        transactionId: 'txn_' + Date.now()
      };
      const enrollResponse = await axios.post(`${BASE_URL}/courses/${courseId}/enroll`, enrollmentData);
      console.log('✅ Enrollment created successfully\n');
    } catch (error) {
      console.log('❌ Enrollment failed:', error.response?.data || error.message);
    }

    // Test 9: Get course statistics
    console.log('9. Testing GET /admin/course-statistics');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/admin/course-statistics?uid=5f21c714-a255-4bab-864e-a36c63466a95`);
      console.log('✅ Course statistics fetched successfully');
      console.log(`   Total courses: ${statsResponse.data.data.totalCourses}\n`);
    } catch (error) {
      console.log('❌ Get statistics failed:', error.response?.data || error.message);
    }

    console.log('🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests
testAPIs(); 