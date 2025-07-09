const express = require('express');
const router = express.Router();
const { 
  getScholarships, 
  getScholarshipById, 
  createScholarship, 
  updateScholarship, 
  deleteScholarship,
  getScholarshipCountries,
  getScholarshipUniversities
} = require('../controllers/scholarshipController');
const { checkAdminByUid } = require('../middlewares/auth');
const { scholarshipValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/scholarships', getScholarships);
router.get('/scholarships/:id', getScholarshipById);
router.get('/scholarship-countries', getScholarshipCountries);
router.get('/scholarship-universities', getScholarshipUniversities);

// Admin-only routes (check admin by UID)
router.post('/scholarships', checkAdminByUid, scholarshipValidationRules, createScholarship);
router.put('/scholarships/:id', checkAdminByUid, updateScholarship);
router.delete('/scholarships/:id', checkAdminByUid, deleteScholarship);

module.exports = router; 