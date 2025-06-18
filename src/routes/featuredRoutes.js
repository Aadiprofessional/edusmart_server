import express from 'express';
const router = express.Router();
import { 
  getAllFeaturedItems,
  getFeaturedItemsByType
} from '../controllers/featuredController.js';

// Public routes
router.get('/featured', getAllFeaturedItems);
router.get('/featured/:type', getFeaturedItemsByType);

export default router; 