import express from 'express';
const router = express.Router();
import { getAllUsers, getUserById, updateUser, deleteUser, getUserStats } from '../controllers/userController.js';

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

export default router; 