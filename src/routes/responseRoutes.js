import express from 'express';
const router = express.Router();
import { 
  getResponses, 
  getResponseById, 
  createResponse, 
  updateResponse, 
  deleteResponse,
  getResponseCategories,
  getResponseTypes
} from '../controllers/responseController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { responseValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/responses', getResponses);
router.get('/responses/:id', getResponseById);
router.get('/response-categories', getResponseCategories);
router.get('/response-types', getResponseTypes);

// Admin-only routes (check admin by UID)
router.post('/responses', checkAdminByUid, responseValidationRules, createResponse);
router.put('/responses/:id', checkAdminByUid, updateResponse);
router.delete('/responses/:id', checkAdminByUid, deleteResponse);

export default router; 