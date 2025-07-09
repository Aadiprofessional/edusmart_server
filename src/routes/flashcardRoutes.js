const express = require('express');
const router = express.Router();
const {
  getUserFlashcardSets,
  getFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard
} = require('../controllers/flashcardController');

// Flashcard Sets Routes
router.get('/sets', getUserFlashcardSets);
router.get('/sets/:id', getFlashcardSetById);
router.post('/sets', createFlashcardSet);
router.put('/sets/:id', updateFlashcardSet);
router.delete('/sets/:id', deleteFlashcardSet);

// Individual Flashcard Routes
router.post('/sets/:setId/cards', addFlashcard);
router.put('/cards/:id', updateFlashcard);
router.delete('/cards/:id', deleteFlashcard);

module.exports = router; 