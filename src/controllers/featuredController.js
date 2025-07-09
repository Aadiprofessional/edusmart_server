const { supabase } = require('../utils/supabase');

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

    // Process results and return clean arrays
    const response = {
      blogs: [],
      courses: [],
      case_studies: [],
      scholarships: [],
      universities: [],
      resources: []
    };

    // Extract successful results
    if (blogsResult.status === 'fulfilled' && !blogsResult.value.error) {
      response.blogs = blogsResult.value.data || [];
    }

    if (coursesResult.status === 'fulfilled' && !coursesResult.value.error) {
      response.courses = coursesResult.value.data || [];
    }

    if (caseStudiesResult.status === 'fulfilled' && !caseStudiesResult.value.error) {
      response.case_studies = caseStudiesResult.value.data || [];
    }

    if (scholarshipsResult.status === 'fulfilled' && !scholarshipsResult.value.error) {
      response.scholarships = scholarshipsResult.value.data || [];
    }

    if (universitiesResult.status === 'fulfilled' && !universitiesResult.value.error) {
      response.universities = universitiesResult.value.data || [];
    }

    if (responsesResult.status === 'fulfilled' && !responsesResult.value.error) {
      response.resources = responsesResult.value.data || [];
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({
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

    let result;

    switch (type) {
      case 'blogs':
        result = await supabase()
          .from('blogs')
          .select('id, title, excerpt, image, category, tags, created_at, author_id', { count: 'exact' })
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      case 'courses':
        result = await supabase()
          .from('courses')
          .select('id, title, description, thumbnail_image, category, level, price, instructor_name, rating, created_at', { count: 'exact' })
          .eq('featured', true)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      case 'case_studies':
        result = await supabase()
          .from('case_studies')
          .select('id, title, description, student_name, student_image, category, outcome, target_country, created_at', { count: 'exact' })
          .eq('featured', true)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      case 'scholarships':
        result = await supabase()
          .from('scholarships')
          .select('id, title, description, amount, university, country, deadline, image, created_at', { count: 'exact' })
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      case 'universities':
        result = await supabase()
          .from('universities')
          .select('id, name, description, country, city, image, ranking, tuition_fee, created_at', { count: 'exact' })
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      case 'resources':
        result = await supabase()
          .from('responses')
          .select('id, title, description, type, category, thumbnail, created_at', { count: 'exact' })
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        break;
      
      default:
        return res.status(400).json({
          error: 'Invalid type',
          message: 'Type must be one of: blogs, courses, case_studies, scholarships, universities, resources'
        });
    }

    const { data: items, error, count } = result;

    if (error) {
      console.error(`Error fetching featured ${type}:`, error);
      return res.status(500).json({
        error: `Failed to fetch featured ${type}`,
        details: error.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
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
      error: `Server error fetching featured ${req.params.type}`,
      details: error.message
    });
  }
};

module.exports = {
  getAllFeaturedItems,
  getFeaturedItemsByType
}; 