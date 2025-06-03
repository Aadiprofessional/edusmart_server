const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout, refreshToken } = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');
const { profileValidationRules } = require('../middlewares/validators');

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user profile
router.get('/profile', getProfile);

// Logout user
router.post('/logout', logout);

// Refresh token
router.post('/refresh', refreshToken);

module.exports = router; 