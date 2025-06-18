import { supabase } from '../utils/supabase.js';

// Get all featured items from all tables
const getAllFeaturedItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const itemLimit = Math.min(parseInt(limit), 50); // Max 50 items per table

    // Fetch featured items from all tables in parallel
    const [
      blogsResult,
      coursesResult,
      caseStudiesResult,
      scholarshipsResult,
      universitiesResult,
      responsesResult
    ] = await Promise.allSettled([
      // Featured blogs
      supabase()
        .from('blogs')
        .select('id, title, excerpt, image, category, tags, created_at, author_id')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(itemLimit),
      
      // Featured courses
      supabase()
        .from('courses')
        .select('id, title, description, thumbnail_image, category, level, price, instructor_name, rating, featured, created_at')
        .eq('featured', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(itemLimit),
      
      // Featured case studies
      supabase()
        .from('case_studies')
        .select('id, title, description, student_name, student_image, category, outcome, target_country, featured, created_at')
        .eq('featured', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(itemLimit),
      
      // Featured scholarships
      supabase()
        .from('scholarships')
        .select('id, title, description, amount, university, country, deadline, image, featured, created_at')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(itemLimit),
      
      // Featured universities
      supabase()
        .from('universities')
        .select('id, name, description, country, city, image, ranking, tuition_fee, featured, created_at')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(itemLimit),
      
      // Featured resources/responses
      supabase()
        .from('responses')
        .select('id, title, description, type, category, thumbnail, featured, created_at')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(itemLimit)
    ]);

    // Process results and handle any errors
    const featuredItems = {
      blogs: [],
      courses: [],
      case_studies: [],
      scholarships: [],
      universities: [],
      resources: []
    };

    // Extract successful results
    if (blogsResult.status === 'fulfilled' && !blogsResult.value.error) {
      featuredItems.blogs = (blogsResult.value.data || []).map(item => ({
        ...item,
        type: 'blog'
      }));
    }

    if (coursesResult.status === 'fulfilled' && !coursesResult.value.error) {
      featuredItems.courses = (coursesResult.value.data || []).map(item => ({
        ...item,
        type: 'course'
      }));
    }

    if (caseStudiesResult.status === 'fulfilled' && !caseStudiesResult.value.error) {
      featuredItems.case_studies = (caseStudiesResult.value.data || []).map(item => ({
        ...item,
        type: 'case_study'
      }));
    }

    if (scholarshipsResult.status === 'fulfilled' && !scholarshipsResult.value.error) {
      featuredItems.scholarships = (scholarshipsResult.value.data || []).map(item => ({
        ...item,
        type: 'scholarship'
      }));
    }

    if (universitiesResult.status === 'fulfilled' && !universitiesResult.value.error) {
      featuredItems.universities = (universitiesResult.value.data || []).map(item => ({
        ...item,
        type: 'university'
      }));
    }

    if (responsesResult.status === 'fulfilled' && !responsesResult.value.error) {
      featuredItems.resources = (responsesResult.value.data || []).map(item => ({
        ...item,
        type: 'resource'
      }));
    }

    // Calculate total counts
    const totalCounts = {
      blogs: featuredItems.blogs.length,
      courses: featuredItems.courses.length,
      case_studies: featuredItems.case_studies.length,
      scholarships: featuredItems.scholarships.length,
      universities: featuredItems.universities.length,
      resources: featuredItems.resources.length
    };

    const totalItems = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);

    res.status(200).json({
      success: true,
      message: 'Featured items retrieved successfully',
      data: featuredItems,
      summary: {
        total_featured_items: totalItems,
        counts_by_type: totalCounts
      }
    });

  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching featured items',
      details: error.message
    });
  }
};

// Get featured items from a specific table
const getFeaturedItemsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query;
    let selectFields;

    switch (type) {
      case 'blogs':
        selectFields = 'id, title, excerpt, image, category, tags, created_at, author_id';
        query = supabase().from('blogs');
        break;
      
      case 'courses':
        selectFields = 'id, title, description, thumbnail_image, category, level, price, instructor_name, rating, created_at';
        query = supabase().from('courses').eq('status', 'published');
        break;
      
      case 'case_studies':
        selectFields = 'id, title, description, student_name, student_image, category, outcome, target_country, created_at';
        query = supabase().from('case_studies').eq('status', 'published');
        break;
      
      case 'scholarships':
        selectFields = 'id, title, description, amount, university, country, deadline, image, created_at';
        query = supabase().from('scholarships');
        break;
      
      case 'universities':
        selectFields = 'id, name, description, country, city, image, ranking, tuition_fee, created_at';
        query = supabase().from('universities');
        break;
      
      case 'resources':
        selectFields = 'id, title, description, type, category, thumbnail, created_at';
        query = supabase().from('responses');
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid type',
          message: 'Type must be one of: blogs, courses, case_studies, scholarships, universities, resources'
        });
    }

    const { data: items, error, count } = await query
      .select(selectFields, { count: 'exact' })
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`Error fetching featured ${type}:`, error);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch featured ${type}`,
        details: error.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: `Featured ${type} retrieved successfully`,
      data: items || [],
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error(`Get featured ${req.params.type} error:`, error);
    res.status(500).json({
      success: false,
      error: `Server error fetching featured ${req.params.type}`,
      details: error.message
    });
  }
};

export {
  getAllFeaturedItems,
  getFeaturedItemsByType
}; 