const express = require('express');
const router = express.Router();
const { 
  getCaseStudies, 
  getCaseStudyById, 
  createCaseStudy, 
  updateCaseStudy, 
  deleteCaseStudy,
  getCaseStudyCategories,
  getCaseStudyOutcomes,
  getCaseStudyCountries,
  getCaseStudyFields
} = require('../controllers/caseStudyController');
const { checkAdminByUid } = require('../middlewares/auth');
const { caseStudyValidationRules } = require('../middlewares/validators');

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

module.exports = router; 