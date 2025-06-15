import express from 'express';
const router = express.Router();
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getCourseCategories,
  getCourseLevels
} from '../controllers/courseController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { courseValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/course-categories', getCourseCategories);
router.get('/course-levels', getCourseLevels);

// Admin-only routes (check admin by UID)
router.post('/courses', checkAdminByUid, courseValidationRules, createCourse);
router.put('/courses/:id', checkAdminByUid, updateCourse);
router.delete('/courses/:id', checkAdminByUid, deleteCourse);

export default router; 