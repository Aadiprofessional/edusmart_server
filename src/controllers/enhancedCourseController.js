const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// =============================================
// COURSE MANAGEMENT
// =============================================

// Get all courses with advanced filtering and pagination
const getCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      level, 
      search, 
      featured, 
      bestseller,
      price_min,
      price_max,
      rating_min,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase()
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 'published');
      
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured === 'true');
    }
    
    if (bestseller !== undefined) {
      query = query.eq('bestseller', bestseller === 'true');
    }
    
    if (price_min) {
      query = query.gte('price', parseFloat(price_min));
    }
    
    if (price_max) {
      query = query.lte('price', parseFloat(price_max));
    }
    
    if (rating_min) {
      query = query.gte('rating', parseFloat(rating_min));
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,instructor_name.ilike.%${search}%`);
    }
    
    // Apply sorting
    const validSortFields = ['created_at', 'rating', 'price', 'total_students', 'title'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortField, sortDirection);
    
    // Apply pagination
    const { data: courses, error, count } = await query.range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
    
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
};

// Get course by ID with full details
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From auth middleware if available
    
    // Get course with related data
    const { data: course, error } = await supabase()
      .from('courses')
      .select(`
        *,
        course_sections(
          id,
          title,
          description,
          section_order,
          duration_minutes,
          course_lectures(
            id,
            title,
            description,
            lecture_type,
            video_duration_seconds,
            lecture_order,
            is_preview,
            is_free,
            summary
          )
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();
      
    if (error || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is enrolled (if authenticated)
    let enrollment = null;
    if (userId) {
      const { data: enrollmentData } = await supabase()
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', id)
        .eq('status', 'active')
        .single();
      
      enrollment = enrollmentData;
    }
    
    // Get recent reviews
    const { data: reviews } = await supabase()
      .from('course_reviews')
      .select(`
        *,
        profiles!user_id(name, avatar_url)
      `)
      .eq('course_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Calculate course statistics
    const totalLectures = course.course_sections?.reduce((acc, section) => 
      acc + (section.course_lectures?.length || 0), 0) || 0;
    
    const totalDuration = course.course_sections?.reduce((acc, section) => 
      acc + (section.duration_minutes || 0), 0) || 0;
    
    res.status(200).json({
      success: true,
      data: {
        course: {
          ...course,
          total_lectures: totalLectures,
          total_duration_minutes: totalDuration,
          is_enrolled: !!enrollment,
          enrollment
        },
        reviews: reviews || []
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Server error fetching course' });
  }
};

// Create a new course (Admin only)
const createCourse = async (req, res) => {
  try {
    const { uid } = req.body;
    const courseData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      level: req.body.level,
      language: req.body.language || 'English',
      price: parseFloat(req.body.price) || 0,
      original_price: req.body.original_price ? parseFloat(req.body.original_price) : null,
      currency: req.body.currency || 'USD',
      thumbnail_image: req.body.thumbnail_image,
      preview_video_url: req.body.preview_video_url,
      instructor_name: req.body.instructor_name,
      instructor_bio: req.body.instructor_bio,
      instructor_image: req.body.instructor_image,
      what_you_will_learn: req.body.what_you_will_learn || [],
      prerequisites: req.body.prerequisites || [],
      target_audience: req.body.target_audience || [],
      course_includes: req.body.course_includes || [],
      tags: req.body.tags || [],
      keywords: req.body.keywords || [],
      meta_description: req.body.meta_description,
      status: req.body.status || 'draft',
      featured: req.body.featured || false,
      certificate_available: req.body.certificate_available !== false,
      created_by: uid
    };
    
    const { data: course, error } = await supabaseAdmin()
      .from('courses')
      .insert([courseData])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating course:', error);
      return res.status(500).json({ error: 'Failed to create course', details: error.message });
    }
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error creating course' });
  }
};

// Update course (Admin only)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.uid; // Remove uid from update data
    updateData.updated_at = new Date();
    
    const { data: course, error } = await supabaseAdmin()
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error updating course' });
  }
};

// Delete course (Admin only)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin()
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error deleting course' });
  }
};

// =============================================
// COURSE SECTIONS MANAGEMENT
// =============================================

// Get course sections
const getCourseSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { uid } = req.query;
    
    console.log('=== getCourseSections DEBUG ===');
    console.log('Request params:', { courseId, uid });
    console.log('Request query:', req.query);
    
    // If UID is provided, check if user is enrolled or is admin
    if (uid) {
      console.log('UID provided, checking access...');
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabaseAdmin()
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single();
      
      console.log('Profile query result:', { 
        profile, 
        profileError: profileError?.message || profileError,
        hasProfile: !!profile,
        role: profile?.role 
      });
      
      const isAdmin = profile?.role === 'admin';
      console.log('Admin check:', { isAdmin, role: profile?.role });
      
      // If not admin, check if user is enrolled
      if (!isAdmin) {
        console.log('User is not admin, checking enrollment...');
        
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin()
          .from('course_enrollments')
          .select('id, status, user_id, course_id, enrolled_at')
          .eq('user_id', uid)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .single();
        
        console.log('Enrollment query result:', { 
          enrollment, 
          enrollmentError: enrollmentError?.message || enrollmentError,
          hasEnrollment: !!enrollment,
          enrollmentStatus: enrollment?.status,
          queryParams: { user_id: uid, course_id: courseId, status: 'active' }
        });
        
        if (!enrollment) {
          console.log('❌ ACCESS DENIED: User not enrolled and not admin');
          
          // Check if there's any enrollment record (regardless of status)
          const { data: anyEnrollment } = await supabaseAdmin()
            .from('course_enrollments')
            .select('id, status, user_id, course_id, enrolled_at')
            .eq('user_id', uid)
            .eq('course_id', courseId);
          
          console.log('Any enrollment check:', anyEnrollment);
          
          return res.status(403).json({ 
            error: 'Must be enrolled to access course content',
            debug: {
              uid,
              courseId,
              isAdmin,
              enrollmentFound: false,
              profileRole: profile?.role,
              enrollmentError: enrollmentError?.message,
              anyEnrollmentFound: !!anyEnrollment?.length,
              anyEnrollments: anyEnrollment
            }
          });
        }
        
        console.log('✅ ACCESS GRANTED: User is enrolled');
      } else {
        console.log('✅ ACCESS GRANTED: User is admin');
      }
    } else {
      console.log('No UID provided, allowing public access to preview content only');
    }
    
    console.log('Fetching course sections...');
    
    // Get course details first
    const { data: course, error: courseError } = await supabaseAdmin()
      .from('courses')
      .select('id, title, instructor_name, total_sections, total_lectures')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      console.error('❌ Course not found:', courseError);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get sections with lectures
    const { data: sections, error } = await supabaseAdmin()
      .from('course_sections')
      .select(`
        *,
        course_lectures(
          id,
          title,
          description,
          lecture_type,
          video_url,
          video_duration_seconds,
          article_content,
          resource_url,
          lecture_order,
          is_preview,
          is_free,
          summary
        )
      `)
      .eq('course_id', courseId)
      .order('section_order');
      
    if (error) {
      console.error('❌ Error fetching sections:', error);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }
    
    // Get user progress if UID is provided
    let progress = [];
    if (uid) {
      const { data: progressData } = await supabaseAdmin()
        .from('lecture_progress')
        .select('lecture_id, progress_percentage, completed, last_watched_position')
        .eq('user_id', uid)
        .eq('course_id', courseId);
      
      progress = progressData || [];
    }
    
    console.log('✅ Sections fetched successfully:', sections?.length || 0);
    console.log('✅ Progress data fetched:', progress?.length || 0);
    console.log('=== END DEBUG ===');
    
    res.status(200).json({
      success: true,
      data: { 
        course,
        sections: sections || [],
        progress: progress || []
      }
    });
  } catch (error) {
    console.error('❌ Get sections error:', error);
    res.status(500).json({ error: 'Server error fetching sections' });
  }
};

// Create course section
const createCourseSection = async (req, res) => {
  try {
    // Get courseId from either URL params or request body
    const courseId = req.params.courseId || req.body.course_id;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    const sectionData = {
      course_id: courseId,
      title: req.body.title,
      description: req.body.description,
      section_order: req.body.section_order
    };
    
    const { data: section, error } = await supabaseAdmin()
      .from('course_sections')
      .insert([sectionData])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating section:', error);
      return res.status(500).json({ error: 'Failed to create section' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: { section }
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Server error creating section' });
  }
};

// Update course section
const updateCourseSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { uid, ...updateData } = req.body; // Extract uid and exclude it from update data
    updateData.updated_at = new Date();
    
    const { data: section, error } = await supabaseAdmin()
      .from('course_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating section:', error);
      return res.status(500).json({ error: 'Failed to update section' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: { section }
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Server error updating section' });
  }
};

// Delete course section
const deleteCourseSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    const { error } = await supabaseAdmin()
      .from('course_sections')
      .delete()
      .eq('id', sectionId);
      
    if (error) {
      console.error('Error deleting section:', error);
      return res.status(500).json({ error: 'Failed to delete section' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Server error deleting section' });
  }
};

// =============================================
// COURSE LECTURES MANAGEMENT
// =============================================

// Create course lecture
const createCourseLecture = async (req, res) => {
  try {
    // Get sectionId from either URL params or request body
    const sectionId = req.params.sectionId || req.body.section_id;
    
    if (!sectionId) {
      return res.status(400).json({ error: 'Section ID is required' });
    }
    
    // Get section to get course_id
    const { data: section } = await supabaseAdmin()
      .from('course_sections')
      .select('course_id')
      .eq('id', sectionId)
      .single();
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    const lectureData = {
      section_id: sectionId,
      course_id: section.course_id,
      title: req.body.title,
      description: req.body.description,
      lecture_type: req.body.lecture_type,
      video_url: req.body.video_url,
      video_duration_seconds: req.body.video_duration_seconds,
      article_content: req.body.article_content,
      resource_url: req.body.resource_url,
      lecture_order: req.body.lecture_order,
      is_preview: req.body.is_preview || false,
      is_free: req.body.is_free || false,
      summary: req.body.summary || null
    };
    
    const { data: lecture, error } = await supabaseAdmin()
      .from('course_lectures')
      .insert([lectureData])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating lecture:', error);
      return res.status(500).json({ error: 'Failed to create lecture' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Lecture created successfully',
      data: { lecture }
    });
  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({ error: 'Server error creating lecture' });
  }
};

// Update course lecture
const updateCourseLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { uid, ...updateData } = req.body; // Extract uid and exclude it from update data
    updateData.updated_at = new Date();
    
    const { data: lecture, error } = await supabaseAdmin()
      .from('course_lectures')
      .update(updateData)
      .eq('id', lectureId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating lecture:', error);
      return res.status(500).json({ error: 'Failed to update lecture' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lecture updated successfully',
      data: { lecture }
    });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({ error: 'Server error updating lecture' });
  }
};

// Delete course lecture
const deleteCourseLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    
    const { error } = await supabaseAdmin()
      .from('course_lectures')
      .delete()
      .eq('id', lectureId);
      
    if (error) {
      console.error('Error deleting lecture:', error);
      return res.status(500).json({ error: 'Failed to delete lecture' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully'
    });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ error: 'Server error deleting lecture' });
  }
};

// =============================================
// COURSE ENROLLMENT MANAGEMENT
// =============================================

// Enroll user in course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, pricePaid, paymentMethod, transactionId } = req.body;
    
    console.log('=== enrollInCourse DEBUG ===');
    console.log('Request params:', { courseId, userId, pricePaid, paymentMethod });
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Check if course exists
    const { data: course, error: courseError } = await supabaseAdmin()
      .from('courses')
      .select('id, title, price, total_lectures')
      .eq('id', courseId)
      .single();
    
    if (courseError || !course) {
      console.error('❌ Course not found:', courseError);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    console.log('✅ Course found:', course.title);
    
    // Check if already enrolled
    const { data: existingEnrollment, error: checkError } = await supabaseAdmin()
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    console.log('Existing enrollment check:', { 
      existingEnrollment, 
      checkError: checkError?.message 
    });
    
    if (existingEnrollment) {
      console.log('✅ User already enrolled');
      return res.status(200).json({ 
        success: true,
        message: 'User already enrolled in this course',
        data: { enrollment: existingEnrollment, alreadyEnrolled: true }
      });
    }
    
    // Create new enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      price_paid: pricePaid || 0,
      currency: 'USD',
      payment_method: paymentMethod || 'free',
      transaction_id: transactionId || `free_${Date.now()}`,
      total_lectures: course.total_lectures || 0,
      status: 'active'
    };
    
    console.log('Creating enrollment with data:', enrollmentData);
    
    const { data: enrollment, error } = await supabaseAdmin()
      .from('course_enrollments')
      .insert([enrollmentData])
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating enrollment:', error);
      return res.status(500).json({ 
        error: 'Failed to enroll in course',
        details: error.message 
      });
    }
    
    console.log('✅ Enrollment created successfully:', enrollment.id);
    console.log('=== END enrollInCourse DEBUG ===');
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: { enrollment, alreadyEnrolled: false }
    });
  } catch (error) {
    console.error('❌ Enroll course error:', error);
    res.status(500).json({ error: 'Server error enrolling in course' });
  }
};

// Get user enrollments
const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: enrollments, error } = await supabase()
      .from('course_enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          subtitle,
          thumbnail_image,
          instructor_name,
          rating,
          total_lectures,
          duration_hours
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching enrollments:', error);
      return res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
    
    res.status(200).json({
      success: true,
      data: { enrollments }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Server error fetching enrollments' });
  }
};

// =============================================
// PROGRESS TRACKING
// =============================================

// Update lecture progress
const updateLectureProgress = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { userId, watchTimeSeconds, completed } = req.body;
    
    // Get lecture details
    const { data: lecture } = await supabase()
      .from('course_lectures')
      .select('course_id, video_duration_seconds')
      .eq('id', lectureId)
      .single();
    
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    // Calculate completion percentage
    const completionPercentage = lecture.video_duration_seconds 
      ? Math.min(100, (watchTimeSeconds / lecture.video_duration_seconds) * 100)
      : completed ? 100 : 0;
    
    const progressData = {
      user_id: userId,
      course_id: lecture.course_id,
      lecture_id: lectureId,
      watch_time_seconds: watchTimeSeconds,
      completion_percentage: completionPercentage,
      completed: completed || completionPercentage >= 80,
      last_accessed_at: new Date(),
      completed_at: (completed || completionPercentage >= 80) ? new Date() : null
    };
    
    const { data: progress, error } = await supabaseAdmin()
      .from('lecture_progress')
      .upsert([progressData], { onConflict: 'user_id,lecture_id' })
      .select()
      .single();
      
    if (error) {
      console.error('Error updating progress:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }
    
    // Update overall course progress
    await updateCourseProgress(userId, lecture.course_id);
    
    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { progress }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Server error updating progress' });
  }
};

// Helper function to update overall course progress
const updateCourseProgress = async (userId, courseId) => {
  try {
    // Get total lectures and completed lectures
    const { data: stats } = await supabase()
      .from('lecture_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    
    const completedLectures = stats?.filter(s => s.completed).length || 0;
    const totalLectures = stats?.length || 0;
    
    const progressPercentage = totalLectures > 0 
      ? Math.round((completedLectures / totalLectures) * 100)
      : 0;
    
    // Update enrollment progress
    await supabaseAdmin()
      .from('course_enrollments')
      .update({
        progress_percentage: progressPercentage,
        completed_lectures: completedLectures,
        last_accessed_at: new Date(),
        completed_at: progressPercentage >= 100 ? new Date() : null
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);
      
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
};

// Get user progress for a course
const getCourseProgress = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    
    const { data: progress, error } = await supabase()
      .from('lecture_progress')
      .select(`
        *,
        course_lectures(
          id,
          title,
          section_id,
          lecture_order,
          video_duration_seconds
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('course_lectures(lecture_order)');
      
    if (error) {
      console.error('Error fetching progress:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }
    
    res.status(200).json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Server error fetching progress' });
  }
};

// =============================================
// COURSE REVIEWS
// =============================================

// Create course review
const createCourseReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, rating, title, comment } = req.body;
    
    // Check if user is enrolled
    const { data: enrollment } = await supabase()
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();
    
    if (!enrollment) {
      return res.status(403).json({ error: 'Must be enrolled to review course' });
    }
    
    const reviewData = {
      user_id: userId,
      course_id: courseId,
      rating,
      title,
      comment
    };
    
    const { data: review, error } = await supabaseAdmin()
      .from('course_reviews')
      .upsert([reviewData], { onConflict: 'user_id,course_id' })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error creating review' });
  }
};

// Get course reviews
const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: reviews, error, count } = await supabase()
      .from('course_reviews')
      .select(`
        *,
        profiles!user_id(name, avatar_url)
      `, { count: 'exact' })
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
};

// =============================================
// AI VIDEO SUMMARY GENERATION
// =============================================

// Generate AI video summary
const generateVideoSummary = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    console.log('Generating AI summary for video:', videoUrl);
    
    // Make request to Qwen API
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen-vl-max",
        input: {
          messages: [
            {
              role: "system",
              content: [{ 
                text: "You are an educational content analyzer. Analyze the video and provide a comprehensive, well-structured summary suitable for educational purposes. Include key topics, main concepts, and learning objectives covered in the video." 
              }]
            },
            {
              role: "user",
              content: [
                { video: videoUrl, fps: 2 },
                { 
                  text: "Please provide a detailed educational summary of this video content. Structure it with clear sections covering: 1) Main Topic/Subject, 2) Key Concepts Covered, 3) Learning Objectives, 4) Important Details/Examples, and 5) Summary/Conclusion. Make it comprehensive and suitable for students." 
                }
              ]
            }
          ]
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Qwen API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to generate summary',
        details: data.message || 'Unknown error from AI service'
      });
    }
    
    if (data.output && data.output.choices && data.output.choices[0]) {
      const summary = data.output.choices[0].message.content[0].text;
      
      res.status(200).json({
        success: true,
        data: { 
          summary,
          usage: data.usage || null
        }
      });
    } else {
      console.error('Unexpected API response format:', data);
      return res.status(500).json({ 
        error: 'Invalid response format from AI service',
        details: 'The AI service returned an unexpected response format'
      });
    }
  } catch (error) {
    console.error('Generate video summary error:', error);
    res.status(500).json({ 
      error: 'Server error generating video summary',
      details: error.message 
    });
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Get course categories
const getCourseCategories = async (req, res) => {
  try {
    // First try to get from course_categories table
    const { data: categories, error } = await supabase()
      .from('course_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
      
    if (!error && categories && categories.length > 0) {
      return res.status(200).json({
        success: true,
        data: { categories }
      });
    }
    
    // Fallback: Extract unique categories from courses table (like basic controller)
    console.log('Falling back to extracting categories from courses table');
    const { data: coursesData, error: coursesError } = await supabase()
      .from('courses')
      .select('category')
      .eq('status', 'published')
      .order('category');
      
    if (coursesError) {
      console.error('Error fetching course categories:', coursesError);
      return res.status(500).json({ error: 'Failed to fetch course categories' });
    }
    
    // Extract unique categories and format them as objects
    const uniqueCategories = [...new Set(coursesData.map(course => course.category).filter(Boolean))];
    const formattedCategories = uniqueCategories.map((categoryName, index) => ({
      id: index.toString(),
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      description: `${categoryName} courses`,
      icon: null,
      color: null
    }));
    
    res.status(200).json({
      success: true,
      data: { categories: formattedCategories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

// Get course levels
const getCourseLevels = async (req, res) => {
  try {
    const { data: coursesData, error } = await supabase()
      .from('courses')
      .select('level')
      .eq('status', 'published')
      .order('level');
      
    if (error) {
      console.error('Error fetching course levels:', error);
      return res.status(500).json({ error: 'Failed to fetch course levels' });
    }
    
    // Extract unique levels
    const uniqueLevels = [...new Set(coursesData.map(course => course.level).filter(Boolean))];
    
    res.status(200).json({
      success: true,
      data: { levels: uniqueLevels }
    });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ error: 'Server error fetching levels' });
  }
};

// Get course statistics (for admin dashboard)
const getCourseStatistics = async (req, res) => {
  try {
    const { data: stats } = await supabase()
      .from('courses')
      .select('status, featured, bestseller')
      .eq('status', 'published');
    
    const { data: enrollmentStats } = await supabase()
      .from('course_enrollments')
      .select('status, price_paid');
    
    const totalCourses = stats?.length || 0;
    const featuredCourses = stats?.filter(s => s.featured).length || 0;
    const bestsellerCourses = stats?.filter(s => s.bestseller).length || 0;
    const totalEnrollments = enrollmentStats?.length || 0;
    const totalRevenue = enrollmentStats?.reduce((sum, e) => sum + (e.price_paid || 0), 0) || 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        featuredCourses,
        bestsellerCourses,
        totalEnrollments,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
};

module.exports = {
  // Course management
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // Section management
  getCourseSections,
  createCourseSection,
  updateCourseSection,
  deleteCourseSection,
  
  // Lecture management
  createCourseLecture,
  updateCourseLecture,
  deleteCourseLecture,
  
  // Enrollment management
  enrollInCourse,
  getUserEnrollments,
  
  // Progress tracking
  updateLectureProgress,
  getCourseProgress,
  
  // Reviews
  createCourseReview,
  getCourseReviews,
  
  // Utilities
  getCourseCategories,
  getCourseLevels,
  getCourseStatistics,
  
  // AI Video Summary
  generateVideoSummary
}; 