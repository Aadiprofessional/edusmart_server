const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all courses with pagination and filtering
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, search, featured } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase()
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 'published'); // Only show published courses
      
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured === 'true');
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,instructor_name.ilike.%${search}%,tags.cs.{${search}}`);
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
    
    const { data: course, error } = await supabase()
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

// Create a new course (Admin only)
const createCourse = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { 
      uid,
      title, 
      subtitle,
      description, 
      category, 
      subcategory,
      level, 
      language,
      price,
      original_price,
      currency,
      duration_hours,
      total_lectures,
      total_sections,
      thumbnail_image,
      preview_video_url,
      instructor_id,
      instructor_name,
      instructor_bio,
      instructor_image,
      what_you_will_learn,
      prerequisites,
      target_audience,
      course_includes,
      tags,
      keywords,
      meta_description,
      status,
      featured,
      bestseller,
      new_course,
      rating,
      total_reviews,
      total_students,
      certificate_available,
      completion_certificate_template,
      
      // Legacy fields that need mapping
      image, // maps to thumbnail_image
      video_preview_url, // maps to preview_video_url
      learning_outcomes // maps to what_you_will_learn
    } = req.body;
    
    console.log('Extracted fields:', { uid, title, category, level });
    
    // The UID has already been verified by checkAdminByUid middleware
    const createdBy = uid;
    
    const insertData = {
      title,
      subtitle: subtitle || null,
      description,
      category,
      subcategory: subcategory || null,
      level,
      language: language || 'English',
      price: price || 0.00,
      original_price: original_price || null,
      currency: currency || 'USD',
      duration_hours: duration_hours || null,
      total_lectures: total_lectures || 0,
      total_sections: total_sections || 0,
      thumbnail_image: thumbnail_image || image || null, // Use thumbnail_image or fallback to image
      preview_video_url: preview_video_url || video_preview_url || null, // Use preview_video_url or fallback to video_preview_url
      instructor_id: instructor_id || null,
      instructor_name,
      instructor_bio: instructor_bio || null,
      instructor_image: instructor_image || null,
      what_you_will_learn: what_you_will_learn || learning_outcomes || [],
      prerequisites: prerequisites || [],
      target_audience: target_audience || [],
      course_includes: course_includes || [],
      tags: tags || [],
      keywords: keywords || [],
      meta_description: meta_description || null,
      status: status || 'draft',
      featured: featured || false,
      bestseller: bestseller || false,
      new_course: new_course !== undefined ? new_course : true,
      rating: rating || 0.00,
      total_reviews: total_reviews || 0,
      total_students: total_students || 0,
      certificate_available: certificate_available !== undefined ? certificate_available : true,
      completion_certificate_template: completion_certificate_template || null,
      created_by: createdBy
    };
    
    console.log('Insert data:', insertData);
    
    // Use admin client to bypass RLS for admin operations
    const { data: course, error } = await supabaseAdmin()
      .from('courses')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating course:', error);
      return res.status(500).json({ error: 'Failed to create course', details: error.message });
    }
    
    console.log('Course created successfully:', course);
    
    res.status(201).json({ 
      message: 'Course created successfully', 
      course 
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error creating course', details: error.message });
  }
};

// Update an existing course (Admin only)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title, 
      subtitle,
      description, 
      category, 
      subcategory,
      level, 
      language,
      price,
      original_price,
      currency,
      duration_hours,
      total_lectures,
      total_sections,
      thumbnail_image,
      preview_video_url,
      instructor_id,
      instructor_name,
      instructor_bio,
      instructor_image,
      what_you_will_learn,
      prerequisites,
      target_audience,
      course_includes,
      tags,
      keywords,
      meta_description,
      status,
      featured,
      bestseller,
      new_course,
      rating,
      total_reviews,
      total_students,
      certificate_available,
      completion_certificate_template,
      
      // Legacy fields that need mapping
      image, // maps to thumbnail_image
      video_preview_url, // maps to preview_video_url
      learning_outcomes // maps to what_you_will_learn
    } = req.body;
    
    // First check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase()
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Update the course using admin client (admin can update any course)
    const { data: updatedCourse, error } = await supabaseAdmin()
      .from('courses')
      .update({
        title,
        subtitle,
        description,
        category,
        subcategory,
        level,
        language,
        price,
        original_price,
        currency,
        duration_hours,
        total_lectures,
        total_sections,
        thumbnail_image: thumbnail_image || image,
        preview_video_url: preview_video_url || video_preview_url,
        instructor_id,
        instructor_name,
        instructor_bio,
        instructor_image,
        what_you_will_learn: what_you_will_learn || learning_outcomes,
        prerequisites,
        target_audience,
        course_includes,
        tags,
        keywords,
        meta_description,
        status,
        featured,
        bestseller,
        new_course,
        rating,
        total_reviews,
        total_students,
        certificate_available,
        completion_certificate_template,
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

// Delete a course (Admin only)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase()
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Delete the course using admin client (admin can delete any course)
    const { error } = await supabaseAdmin()
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
    const { data, error } = await supabase()
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
    const { data, error } = await supabase()
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