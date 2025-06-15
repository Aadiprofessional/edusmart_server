import express from 'express';
const router = express.Router();
import {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByCountry,
  searchUniversities,
  getUniversityCountries
} from '../controllers/universityController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { universityValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/', getAllUniversities);
router.get('/countries', getUniversityCountries);
router.get('/country/:country', getUniversitiesByCountry);
router.get('/search/:query', searchUniversities);
router.get('/:id', getUniversityById);

// Admin-only routes (check admin by UID)
router.post('/', checkAdminByUid, universityValidationRules, createUniversity);
router.put('/:id', checkAdminByUid, updateUniversity);
router.delete('/:id', checkAdminByUid, deleteUniversity);

export default router; 