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
const { authenticateUser, validateUid, isAdmin } = require('../middlewares/auth');
const { scholarshipValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/scholarships', getScholarships);
router.get('/scholarships/:id', getScholarshipById);
router.get('/scholarship-countries', getScholarshipCountries);
router.get('/scholarship-universities', getScholarshipUniversities);

// Protected routes
router.post('/scholarships', authenticateUser, isAdmin, validateUid, scholarshipValidationRules, createScholarship);
router.put('/scholarships/:id', authenticateUser, validateUid, updateScholarship);
router.delete('/scholarships/:id', authenticateUser, validateUid, deleteScholarship);

module.exports = router; 