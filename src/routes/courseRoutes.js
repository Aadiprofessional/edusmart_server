const express = require('express');
const router = express.Router();
const { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getCourseCategories,
  getCourseLevels
} = require('../controllers/courseController');
const { authenticateUser, validateUid, isAdmin } = require('../middlewares/auth');
const { courseValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/course-categories', getCourseCategories);
router.get('/course-levels', getCourseLevels);

// Protected routes
router.post('/courses', authenticateUser, isAdmin, validateUid, courseValidationRules, createCourse);
router.put('/courses/:id', authenticateUser, validateUid, updateCourse);
router.delete('/courses/:id', authenticateUser, validateUid, deleteCourse);

module.exports = router; 