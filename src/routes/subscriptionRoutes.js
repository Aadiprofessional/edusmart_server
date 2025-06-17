import express from 'express';
import {
  getSubscriptionPlans,
  getAddonPlans,
  buySubscription,
  buyAddon,
  getUserSubscription,
  useResponse,
  getResponseHistory,
  getTransactionHistory,
  getUsageLogs,
  getAllSubscriptions,
  refreshResponses
} from '../controllers/subscriptionController.js';
import { authenticateUser, authenticateUserWithProfile } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/plans', getSubscriptionPlans);
router.get('/addons', getAddonPlans);

// User routes (authentication required)
router.post('/buy', authenticateUser, buySubscription);
router.post('/buy-addon', authenticateUser, buyAddon);
router.get('/status', authenticateUser, getUserSubscription);
router.post('/use-response', authenticateUser, useResponse);
router.get('/responses', authenticateUser, getResponseHistory);
router.get('/transactions', authenticateUser, getTransactionHistory);
router.get('/usage-logs', authenticateUser, getUsageLogs);

// Admin routes (admin authentication required)
router.get('/admin/all', authenticateUserWithProfile, getAllSubscriptions);
router.post('/admin/refresh-responses', authenticateUserWithProfile, refreshResponses);

export default router; 