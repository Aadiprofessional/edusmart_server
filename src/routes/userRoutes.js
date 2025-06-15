import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get user statistics (must come before /:id route)
router.get('/stats/overview', userController.getUserStats);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

export default router; 