const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');

// Get all universities
router.get('/', universityController.getAllUniversities);

// Get university by ID
router.get('/:id', universityController.getUniversityById);

// Create new university
router.post('/', universityController.createUniversity);

// Update university
router.put('/:id', universityController.updateUniversity);

// Delete university
router.delete('/:id', universityController.deleteUniversity);

// Get universities by country
router.get('/country/:country', universityController.getUniversitiesByCountry);

// Search universities
router.get('/search/:query', universityController.searchUniversities);

module.exports = router; 