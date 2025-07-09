const express = require('express');
const router = express.Router();
const { 
  getAllUniversities, 
  getUniversityById, 
  createUniversity, 
  updateUniversity, 
  deleteUniversity,
  getUniversityCountries,
  getUniversitiesByCountry,
  searchUniversities
} = require('../controllers/universityController');
const { checkAdminByUid } = require('../middlewares/auth');
const { universityValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/', getAllUniversities);
router.get('/countries', getUniversityCountries);
router.get('/country/:country', getUniversitiesByCountry);
router.get('/search/:query', searchUniversities);
router.get('/:id', getUniversityById);

// Admin-only routes (check admin by UID)
router.post('/', checkAdminByUid, universityValidationRules, createUniversity);
router.put('/:id', checkAdminByUid, updateUniversity);
router.delete('/:id', checkAdminByUid, deleteUniversity);

module.exports = router; 