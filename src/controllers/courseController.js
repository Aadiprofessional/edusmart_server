const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all courses with pagination and filtering
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply pagination
    const { data: courses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      courses,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching course:', error);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.status(200).json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Server error fetching course' });
  }
};

// Create a new course
const createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      level, 
      duration, 
      price, 
      image, 
      instructor_name,
      instructor_bio,
      syllabus,
      uid 
    } = req.body;
    
    // Create a new course entry
    const { data: course, error } = await supabase
      .from('courses')
      .insert([
        {
          id: uuidv4(),
          title,
          description,
          category,
          level,
          duration,
          price,
          image,
          instructor_name,
          instructor_bio,
          syllabus,
          created_by: uid,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating course:', error);
      return res.status(500).json({ error: 'Failed to create course' });
    }
    
    res.status(201).json({ 
      message: 'Course created successfully', 
      course 
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error creating course' });
  }
};

// Update an existing course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      level, 
      duration, 
      price, 
      image, 
      instructor_name,
      instructor_bio,
      syllabus,
      uid 
    } = req.body;
    
    // First check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is the creator or has admin role
    if (existingCourse.created_by !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this course' });
    }
    
    // Update the course
    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        title,
        description,
        category,
        level,
        duration,
        price,
        image,
        instructor_name,
        instructor_bio,
        syllabus,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
    
    res.status(200).json({ 
      message: 'Course updated successfully', 
      course: updatedCourse 
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error updating course' });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is the creator or has admin role
    if (existingCourse.created_by !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this course' });
    }
    
    // Delete the course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
    
    res.status(200).json({ 
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error deleting course' });
  }
};

// Get course categories
const getCourseCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('category')
      .order('category');
      
    if (error) {
      console.error('Error fetching course categories:', error);
      return res.status(500).json({ error: 'Failed to fetch course categories' });
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(course => course.category))];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get course categories error:', error);
    res.status(500).json({ error: 'Server error fetching course categories' });
  }
};

// Get course levels
const getCourseLevels = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('level')
      .order('level');
      
    if (error) {
      console.error('Error fetching course levels:', error);
      return res.status(500).json({ error: 'Failed to fetch course levels' });
    }
    
    // Extract unique levels
    const levels = [...new Set(data.map(course => course.level))];
    
    res.status(200).json({ levels });
  } catch (error) {
    console.error('Get course levels error:', error);
    res.status(500).json({ error: 'Server error fetching course levels' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseCategories,
  getCourseLevels
}; 