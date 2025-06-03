const express = require('express');
const router = express.Router();
const {
  createOrUpdateProfile,
  getUserProfile,
  updateProfileFields,
  deleteUserProfile,
  getProfileCompletion
} = require('../controllers/userProfileController');
const { authenticateUser } = require('../middlewares/auth');

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

module.exports = router; 