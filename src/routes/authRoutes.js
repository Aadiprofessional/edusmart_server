import express from 'express';
const router = express.Router();
import { register, login, getProfile, logout, refreshToken } from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/auth.js';
import { profileValidationRules } from '../middlewares/validators.js';

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

export default router; 