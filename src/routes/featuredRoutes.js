const express = require('express');
const router = express.Router();
const { 
  getAllFeaturedItems,
  getFeaturedItemsByType
} = require('../controllers/featuredController');

// Public routes
router.get('/featured', getAllFeaturedItems);
router.get('/featured/:type', getFeaturedItemsByType);

module.exports = router; 