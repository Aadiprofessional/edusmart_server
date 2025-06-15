import express from 'express';
const router = express.Router();
import applicationController from '../controllers/applicationController.js';

// Get all applications (admin only)
router.get('/', applicationController.getAllApplications);

// Get application statistics (must come before /:id route)
router.get('/stats/overview', applicationController.getApplicationStats);

// Get applications by user (must come before /:id route)
router.get('/user/:userId', applicationController.getApplicationsByUser);

// Get application by ID
router.get('/:id', applicationController.getApplicationById);

// Create new application
router.post('/', applicationController.createApplication);

// Update application
router.put('/:id', applicationController.updateApplication);

// Delete application
router.delete('/:id', applicationController.deleteApplication);

// Update application status
router.patch('/:id/status', applicationController.updateApplicationStatus);

export default router; 