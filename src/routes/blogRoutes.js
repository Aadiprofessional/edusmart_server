import express from 'express';
const router = express.Router();
import { 
  getBlogs, 
  getBlogById, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getBlogCategories,
  getBlogTags
} from '../controllers/blogController.js';
import { checkAdminByUid } from '../middlewares/auth.js';
import { blogValidationRules } from '../middlewares/validators.js';

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);
router.get('/blog-categories', getBlogCategories);
router.get('/blog-tags', getBlogTags);

// Admin-only routes (check admin by UID)
router.post('/blogs', checkAdminByUid, blogValidationRules, createBlog);
router.put('/blogs/:id', checkAdminByUid, updateBlog);
router.delete('/blogs/:id', checkAdminByUid, deleteBlog);

export default router; 