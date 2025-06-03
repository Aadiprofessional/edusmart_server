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
const { checkAdminByUid } = require('../middlewares/auth');
const { courseValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/course-categories', getCourseCategories);
router.get('/course-levels', getCourseLevels);

// Admin-only routes (check admin by UID)
router.post('/courses', checkAdminByUid, courseValidationRules, createCourse);
router.put('/courses/:id', checkAdminByUid, updateCourse);
router.delete('/courses/:id', checkAdminByUid, deleteCourse);

module.exports = router; 