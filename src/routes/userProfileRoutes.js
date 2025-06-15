import express from 'express';
const router = express.Router();
import {
  createOrUpdateProfile,
  getUserProfile,
  updateProfileFields,
  deleteUserProfile,
  getProfileCompletion
} from '../controllers/userProfileController.js';
import { authenticateUser } from '../middlewares/auth.js';

// All routes require authentication
router.use(authenticateUser);

// Get user profile
router.get('/profile', getUserProfile);

// Create or update complete user profile
router.post('/profile', createOrUpdateProfile);

// Update complete user profile (same as POST)
router.put('/profile', createOrUpdateProfile);

// Update specific profile fields
router.patch('/profile', updateProfileFields);

// Delete user profile
router.delete('/profile', deleteUserProfile);

// Get profile completion percentage
router.get('/profile/completion', getProfileCompletion);

export default router; 