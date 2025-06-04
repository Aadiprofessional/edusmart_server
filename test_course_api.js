const axios = require('axios');

async function testCourseAPI() {
  try {
    console.log('Testing course creation API...');
    
    const testCourse = {
      title: 'Test Course API',
      description: 'This is a test course to verify the API is working correctly with proper UID handling.',
      category: 'programming',
      level: 'beginner',
      duration: '4 weeks',
      price: 99.99,
      original_price: 149.99,
      instructor_name: 'Test Instructor',
      instructor_bio: 'Experienced developer and educator',
      prerequisites: ['Basic programming knowledge'],
      learning_outcomes: ['Build web applications', 'Understand modern frameworks'],
      skills_gained: ['React', 'JavaScript', 'Web Development'],
      tags: ['web-dev', 'react', 'javascript'],
      language: 'English',
      certificate: true,
      featured: false,
      status: 'active',
      uid: 'bca2f806-29c5-4be9-bc2d-a484671546cd'
    };

    const response = await axios.post('http://localhost:8000/api/courses', testCourse, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Course creation successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Course creation failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testCourseAPI(); 