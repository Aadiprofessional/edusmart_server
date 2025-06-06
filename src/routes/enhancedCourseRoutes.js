const express = require('express');
const router = express.Router();
const {
  // Course management
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // Section management
  getCourseSections,
  createCourseSection,
  updateCourseSection,
  deleteCourseSection,
  
  // Lecture management
  createCourseLecture,
  updateCourseLecture,
  deleteCourseLecture,
  
  // Enrollment management
  enrollInCourse,
  getUserEnrollments,
  
  // Progress tracking
  updateLectureProgress,
  getCourseProgress,
  
  // Reviews
  createCourseReview,
  getCourseReviews,
  
  // Utilities
  getCourseCategories,
  getCourseStatistics
} = require('../controllers/enhancedCourseController');

const { checkAdminByUid } = require('../middlewares/auth');
const { courseValidationRules } = require('../middlewares/validators');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// Get all courses with filtering and pagination
router.get('/courses', getCourses);

// Get course by ID with full details
router.get('/courses/:id', getCourseById);

// Get course categories
router.get('/course-categories', getCourseCategories);

// Get course reviews
router.get('/courses/:courseId/reviews', getCourseReviews);

// Get course sections for enrolled users (public access for enrolled users)
router.get('/courses/:courseId/sections', getCourseSections);

// =============================================
// ADMIN ROUTES (Admin authentication required)
// =============================================

// Course management
router.post('/courses', checkAdminByUid, createCourse);
router.put('/courses/:id', checkAdminByUid, updateCourse);
router.delete('/courses/:id', checkAdminByUid, deleteCourse);

// Course statistics (admin dashboard)
router.get('/admin/course-statistics', checkAdminByUid, getCourseStatistics);

// Section management (admin only for create/update/delete)
router.post('/courses/:courseId/sections', checkAdminByUid, createCourseSection);
router.put('/sections/:sectionId', checkAdminByUid, updateCourseSection);
router.delete('/sections/:sectionId', checkAdminByUid, deleteCourseSection);

// Lecture management
router.post('/sections/:sectionId/lectures', checkAdminByUid, createCourseLecture);
router.put('/lectures/:lectureId', checkAdminByUid, updateCourseLecture);
router.delete('/lectures/:lectureId', checkAdminByUid, deleteCourseLecture);

// =============================================
// USER ROUTES (User authentication required)
// =============================================

// Enrollment management
router.post('/courses/:courseId/enroll', enrollInCourse);
router.get('/users/:userId/enrollments', getUserEnrollments);

// Progress tracking
router.put('/lectures/:lectureId/progress', updateLectureProgress);
router.get('/courses/:courseId/users/:userId/progress', getCourseProgress);

// Course reviews
router.post('/courses/:courseId/reviews', createCourseReview);

// =============================================
// PROTECTED COURSE CONTENT ROUTES
// =============================================

// Get course sections (for enrolled users or admins)
router.get('/enrolled/courses/:courseId/sections', getCourseSections);

module.exports = router; 