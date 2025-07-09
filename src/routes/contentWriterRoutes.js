const express = require('express');
const router = express.Router();
const {
  saveContent,
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats
} = require('../controllers/contentWriterController');

// Save generated content
router.post('/save', saveContent);

// Get content history for a user
router.get('/history/:uid', getContentHistory);

// Get specific content by ID
router.get('/:id', getContentById);

// Update existing content
router.put('/:id', updateContent);

// Delete content
router.delete('/:id', deleteContent);

// Get content statistics for a user
router.get('/stats/:uid', getContentStats);

module.exports = router; 