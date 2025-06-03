const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateUser, validateUid } = require('../middlewares/auth');
const { profileValidationRules } = require('../middlewares/validators');

// Register a new user
router.post('/register', validateUid, register);

// Login user
router.post('/login', login);

// Get current user profile
router.get('/profile', authenticateUser, getProfile);

module.exports = router; 