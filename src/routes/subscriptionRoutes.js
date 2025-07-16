const express = require('express');
const router = express.Router();
const { 
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
  refreshResponses,
  createSubscriptionPayment,
  createAddonPayment
} = require('../controllers/subscriptionController');
const { authenticateUser, authenticateUserWithProfile } = require('../middlewares/auth');

// Public routes (no authentication required)
router.get('/plans', getSubscriptionPlans);
router.get('/addons', getAddonPlans);

// User routes (authentication required)
router.post('/buy', authenticateUser, buySubscription);
router.post('/buy-addon', authenticateUser, buyAddon);

// Antom payment routes (authentication required)
router.post('/payment/subscription', authenticateUser, createSubscriptionPayment);
router.post('/payment/addon', authenticateUser, createAddonPayment);
router.get('/status', authenticateUser, getUserSubscription);
router.post('/use-response', authenticateUser, useResponse);
router.get('/responses', authenticateUser, getResponseHistory);
router.get('/transactions', authenticateUser, getTransactionHistory);
router.get('/usage-logs', authenticateUser, getUsageLogs);

// Admin routes (admin authentication required)
router.get('/admin/all', authenticateUserWithProfile, getAllSubscriptions);
router.post('/admin/refresh-responses', authenticateUserWithProfile, refreshResponses);

module.exports = router; 