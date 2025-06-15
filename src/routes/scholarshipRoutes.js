import express from 'express';
const router = express.Router();
import { 
  getScholarships, 
  getScholarshipById, 
  createScholarship, 
  updateScholarship, 
  deleteScholarship,
  getScholarshipCountries,
  getScholarshipUniversities
} from '../controllers/scholarshipController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { scholarshipValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/scholarships', getScholarships);
router.get('/scholarships/:id', getScholarshipById);
router.get('/scholarship-countries', getScholarshipCountries);
router.get('/scholarship-universities', getScholarshipUniversities);

// Admin-only routes (check admin by UID)
router.post('/scholarships', checkAdminByUid, scholarshipValidationRules, createScholarship);
router.put('/scholarships/:id', checkAdminByUid, updateScholarship);
router.delete('/scholarships/:id', checkAdminByUid, deleteScholarship);

export default router; 