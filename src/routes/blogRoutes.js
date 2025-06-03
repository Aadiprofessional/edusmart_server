const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlogById, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getBlogCategories,
  getBlogTags
} = require('../controllers/blogController');
const { authenticateUser, validateUid, isAdmin } = require('../middlewares/auth');
const { blogValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);
router.get('/blog-categories', getBlogCategories);
router.get('/blog-tags', getBlogTags);

// Protected routes
router.post('/blogs', authenticateUser, isAdmin, validateUid, blogValidationRules, createBlog);
router.put('/blogs/:id', authenticateUser, validateUid, updateBlog);
router.delete('/blogs/:id', authenticateUser, validateUid, deleteBlog);

module.exports = router; 