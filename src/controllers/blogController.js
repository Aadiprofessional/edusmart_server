import { supabase, supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Get all blogs with pagination and filtering
const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabaseAdmin()
      .from('blogs')
      .select('*', { count: 'exact' });
      
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

    // Get author information separately
    let blogsWithAuthors = blogs;
    if (blogs && blogs.length > 0) {
      const authorIds = [...new Set(blogs.map(blog => blog.author_id).filter(Boolean))];
      
      if (authorIds.length > 0) {
        const { data: authors, error: authorsError } = await supabaseAdmin()
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', authorIds);
        
        if (!authorsError && authors) {
          // Combine blogs with author information
          blogsWithAuthors = blogs.map(blog => ({
            ...blog,
            author: authors.find(author => author.id === blog.author_id) || null
          }));
        }
      }
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      blogs: blogsWithAuthors,
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
    
    const { data: blog, error } = await supabaseAdmin()
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching blog:', error);
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Get author information separately
    let blogWithAuthor = blog;
    if (blog && blog.author_id) {
      const { data: author, error: authorError } = await supabaseAdmin()
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', blog.author_id)
        .single();
      
      if (!authorError && author) {
        blogWithAuthor = {
          ...blog,
          author
        };
      }
    }
    
    res.status(200).json({ blog: blogWithAuthor });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Server error fetching blog' });
  }
};

// Create a new blog (Admin only)
const createBlog = async (req, res) => {
  try {
    const { 
      uid,
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      image
    } = req.body;
    
    // The UID has already been verified by checkAdminByUid middleware
    const authorId = uid;
    
    // Prepare blog data without featured field to avoid schema issues
    const blogData = {
      id: uuidv4(),
      title,
      content,
      excerpt,
      category,
      tags,
      image,
      author_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Use admin client to bypass RLS for admin operations
    const { data: blog, error } = await supabaseAdmin()
      .from('blogs')
      .insert([blogData])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating blog:', error);
      return res.status(500).json({ 
        error: 'Failed to create blog',
        details: error.message 
      });
    }
    
    res.status(201).json({ 
      message: 'Blog created successfully', 
      blog 
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ 
      error: 'Server error creating blog',
      details: error.message 
    });
  }
};

// Update an existing blog (Admin only)
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      image
    } = req.body;
    
    // First check if the blog exists
    const { data: existingBlog, error: fetchError } = await supabaseAdmin()
      .from('blogs')
      .select('author_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Prepare update data without featured field
    const updateData = {
      title,
      content,
      excerpt,
      category,
      tags,
      image,
      updated_at: new Date().toISOString()
    };
    
    // Update the blog using admin client (admin can update any blog)
    const { data: updatedBlog, error } = await supabaseAdmin()
      .from('blogs')
      .update(updateData)
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

// Delete a blog (Admin only)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the blog exists
    const { data: existingBlog, error: fetchError } = await supabaseAdmin()
      .from('blogs')
      .select('author_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Delete the blog using admin client (admin can delete any blog)
    const { error } = await supabaseAdmin()
      .from('blogs')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting blog:', error);
      return res.status(500).json({ error: 'Failed to delete blog' });
    }
    
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Server error deleting blog' });
  }
};

// Get all blog categories
const getBlogCategories = async (req, res) => {
  try {
    const { data: blogs, error } = await supabaseAdmin()
      .from('blogs')
      .select('category')
      .not('category', 'is', null);
      
    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    
    // Extract unique categories
    const categories = [...new Set(blogs.map(blog => blog.category))];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

// Get all blog tags
const getBlogTags = async (req, res) => {
  try {
    const { data: blogs, error } = await supabaseAdmin()
      .from('blogs')
      .select('tags')
      .not('tags', 'is', null);
      
    if (error) {
      console.error('Error fetching tags:', error);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }
    
    // Extract unique tags from all blogs
    const allTags = blogs.reduce((tags, blog) => {
      if (blog.tags && Array.isArray(blog.tags)) {
        return [...tags, ...blog.tags];
      }
      return tags;
    }, []);
    
    const uniqueTags = [...new Set(allTags)];
    
    res.status(200).json({ tags: uniqueTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Server error fetching tags' });
  }
};

export {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  getBlogTags
}; 