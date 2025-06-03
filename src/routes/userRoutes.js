const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Get user applications
router.get('/:id/applications', userController.getUserApplications);

// Get user statistics
router.get('/stats/overview', userController.getUserStats);

module.exports = router; 