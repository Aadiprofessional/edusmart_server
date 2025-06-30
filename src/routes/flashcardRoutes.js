import express from 'express';
const router = express.Router();
import {
  getUserFlashcardSets,
  getFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard
} from '../controllers/flashcardController.js';

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

export default router; 