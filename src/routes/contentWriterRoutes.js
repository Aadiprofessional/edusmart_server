import express from 'express';
import {
  saveContent,
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats
} from '../controllers/contentWriterController.js';

const router = express.Router();

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

export default router; 