const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all blogs with pagination and filtering
const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('blogs')
      .select('*, author:profiles(name, avatar_url)', { count: 'exact' });
      
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }
    
    // Apply pagination
    const { data: blogs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching blogs:', error);
      return res.status(500).json({ error: 'Failed to fetch blogs' });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      blogs,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: 'Server error fetching blogs' });
  }
};

// Get a single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*, author:profiles(name, avatar_url, title)')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching blog:', error);
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.status(200).json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Server error fetching blog' });
  }
};

// Create a new blog
const createBlog = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      image, 
      uid 
    } = req.body;
    
    // Create a new blog entry
    const { data: blog, error } = await supabase
      .from('blogs')
      .insert([
        {
          id: uuidv4(),
          title,
          content,
          excerpt,
          category,
          tags,
          image,
          author_id: uid,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating blog:', error);
      return res.status(500).json({ error: 'Failed to create blog' });
    }
    
    res.status(201).json({ 
      message: 'Blog created successfully', 
      blog 
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Server error creating blog' });
  }
};

// Update an existing blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      image, 
      uid 
    } = req.body;
    
    // First check if the blog exists
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('author_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Check if user is the author or has admin role
    if (existingBlog.author_id !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this blog' });
    }
    
    // Update the blog
    const { data: updatedBlog, error } = await supabase
      .from('blogs')
      .update({
        title,
        content,
        excerpt,
        category,
        tags,
        image,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating blog:', error);
      return res.status(500).json({ error: 'Failed to update blog' });
    }
    
    res.status(200).json({ 
      message: 'Blog updated successfully', 
      blog: updatedBlog 
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Server error updating blog' });
  }
};

// Delete a blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the blog exists
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('author_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Check if user is the author or has admin role
    if (existingBlog.author_id !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this blog' });
    }
    
    // Delete the blog
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting blog:', error);
      return res.status(500).json({ error: 'Failed to delete blog' });
    }
    
    res.status(200).json({ 
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Server error deleting blog' });
  }
};

// Get blog categories
const getBlogCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('category')
      .order('category');
      
    if (error) {
      console.error('Error fetching blog categories:', error);
      return res.status(500).json({ error: 'Failed to fetch blog categories' });
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(blog => blog.category))];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ error: 'Server error fetching blog categories' });
  }
};

// Get blog tags
const getBlogTags = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('tags');
      
    if (error) {
      console.error('Error fetching blog tags:', error);
      return res.status(500).json({ error: 'Failed to fetch blog tags' });
    }
    
    // Extract and flatten all tags
    const allTags = data.flatMap(blog => blog.tags || []);
    // Extract unique tags
    const tags = [...new Set(allTags)];
    
    res.status(200).json({ tags });
  } catch (error) {
    console.error('Get blog tags error:', error);
    res.status(500).json({ error: 'Server error fetching blog tags' });
  }
};

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  getBlogTags
}; 