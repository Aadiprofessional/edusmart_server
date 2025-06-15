import express from 'express';
const router = express.Router();
import { 
  getCaseStudies, 
  getCaseStudyById, 
  createCaseStudy, 
  updateCaseStudy, 
  deleteCaseStudy,
  getCaseStudyCategories,
  getCaseStudyOutcomes,
  getCaseStudyCountries,
  getCaseStudyFields
} from '../controllers/caseStudyController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { caseStudyValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/', getCaseStudies);
router.get('/categories', getCaseStudyCategories);
router.get('/outcomes', getCaseStudyOutcomes);
router.get('/countries', getCaseStudyCountries);
router.get('/fields', getCaseStudyFields);
router.get('/:id', getCaseStudyById);

// Admin routes (require authentication)
router.post('/', checkAdminByUid, caseStudyValidationRules, createCaseStudy);
router.put('/:id', checkAdminByUid, caseStudyValidationRules, updateCaseStudy);
router.delete('/:id', checkAdminByUid, deleteCaseStudy);

export default router; 