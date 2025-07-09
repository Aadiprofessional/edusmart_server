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
  getCourseLevels,
  getCourseStatistics,
  
  // AI Video Summary
  generateVideoSummary
} = require('../controllers/enhancedCourseController');

const { checkAdminByUid } = require('../middlewares/auth');
const { courseValidationRules } = require('../middlewares/validators');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// Get all courses with filtering and pagination
router.get('/courses', getCourses);

// Get course categories
router.get('/course-categories', getCourseCategories);
router.get('/courses/categories', getCourseCategories);

// Get course levels
router.get('/course-levels', getCourseLevels);
router.get('/courses/levels', getCourseLevels);

// SPECIFIC COURSE ROUTES (must come before /courses/:id)
// Get course reviews
router.get('/courses/:courseId/reviews', getCourseReviews);

// Get course sections for enrolled users (public access for enrolled users)
router.get('/courses/:courseId/sections', getCourseSections);

// Enrollment management
router.post('/courses/:courseId/enroll', enrollInCourse);

// Check enrollment status (for debugging)
router.get('/courses/:courseId/enrollment/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    
    const { data: enrollment, error } = await (await import('../utils/supabase.js')).supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    res.json({
      success: true,
      data: {
        enrolled: !!enrollment,
        enrollment: enrollment || null,
        error: error?.message || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error checking enrollment' });
  }
});

// Progress tracking
router.post('/courses/:courseId/progress', updateLectureProgress);
router.get('/courses/:courseId/progress/:userId', getCourseProgress);

// Course reviews
router.post('/courses/:courseId/reviews', createCourseReview);

// Section management (admin only for create/update/delete)
router.post('/courses/:courseId/sections', checkAdminByUid, createCourseSection);

// GENERIC COURSE ROUTE (must come after specific routes)
// Get course by ID with full details
router.get('/courses/:id', getCourseById);

// =============================================
// ADMIN ROUTES (Admin authentication required)
// =============================================

// Course management
router.post('/courses', checkAdminByUid, createCourse);
router.put('/courses/:id', checkAdminByUid, updateCourse);
router.delete('/courses/:id', checkAdminByUid, deleteCourse);

// Course statistics (admin dashboard)
router.get('/admin/course-statistics', checkAdminByUid, getCourseStatistics);

// Section management (admin only for update/delete)
router.put('/sections/:sectionId', checkAdminByUid, updateCourseSection);
router.delete('/sections/:sectionId', checkAdminByUid, deleteCourseSection);

// Lecture management
router.post('/sections/:sectionId/lectures', checkAdminByUid, createCourseLecture);
router.put('/lectures/:lectureId', checkAdminByUid, updateCourseLecture);
router.delete('/lectures/:lectureId', checkAdminByUid, deleteCourseLecture);

// =============================================
// PROTECTED COURSE CONTENT ROUTES
// =============================================

// Get course sections (for enrolled users or admins)
router.get('/enrolled/courses/:courseId/sections', getCourseSections);

// AI Video Summary Generation
router.post('/generate-video-summary', generateVideoSummary);

// =============================================
// USER ROUTES (User authentication required)
// =============================================

// User enrollments
router.get('/users/:userId/enrollments', getUserEnrollments);

module.exports = router; 