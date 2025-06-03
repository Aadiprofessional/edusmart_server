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
const { checkAdminByUid } = require('../middlewares/auth');
const { blogValidationRules } = require('../middlewares/validators');

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);
router.get('/blog-categories', getBlogCategories);
router.get('/blog-tags', getBlogTags);

// Admin-only routes (check admin by UID)
router.post('/blogs', checkAdminByUid, blogValidationRules, createBlog);
router.put('/blogs/:id', checkAdminByUid, updateBlog);
router.delete('/blogs/:id', checkAdminByUid, deleteBlog);

module.exports = router; 