const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

// Get all applications (admin only)
router.get('/', applicationController.getAllApplications);

// Get application by ID
router.get('/:id', applicationController.getApplicationById);

// Create new application
router.post('/', applicationController.createApplication);

// Update application
router.put('/:id', applicationController.updateApplication);

// Delete application
router.delete('/:id', applicationController.deleteApplication);

// Get applications by user
router.get('/user/:userId', applicationController.getApplicationsByUser);

// Update application status
router.patch('/:id/status', applicationController.updateApplicationStatus);

// Get application statistics
router.get('/stats/overview', applicationController.getApplicationStats);

module.exports = router; 