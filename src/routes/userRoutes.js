const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getUserStats } = require('../controllers/userController');

// Get all users (admin only)
router.get('/', getAllUsers);

// Get user statistics (must come before /:id route)
router.get('/stats/overview', getUserStats);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router; 