const express = require('express');
const router = express.Router();
const { 
  getResponses, 
  getResponseById, 
  createResponse, 
  updateResponse, 
  deleteResponse,
  getResponseCategories,
  getResponseTypes
} = require('../controllers/responseController');
const { checkAdminByUid } = require('../middlewares/auth');
const { responseValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/responses', getResponses);
router.get('/responses/:id', getResponseById);
router.get('/response-categories', getResponseCategories);
router.get('/response-types', getResponseTypes);

// Admin-only routes (check admin by UID)
router.post('/responses', checkAdminByUid, responseValidationRules, createResponse);
router.put('/responses/:id', checkAdminByUid, updateResponse);
router.delete('/responses/:id', checkAdminByUid, deleteResponse);

module.exports = router; 