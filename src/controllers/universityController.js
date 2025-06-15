import { supabase, supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate unique slug
const generateUniqueSlug = async (name) => {
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens

  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists and generate unique one
  while (true) {
    const { data: existing } = await supabase
      .from('universities')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!existing) {
      break; // Slug is unique
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Get all universities with pagination and filtering
const getAllUniversities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const country = req.query.country;
    const type = req.query.type;
    const search = req.query.search;

    let query = supabaseAdmin()
      .from('universities')
      .select('*', { count: 'exact' });

    // Apply filters
    if (country) {
      query = query.eq('country', country);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: universities, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching universities:', error);
      return res.status(500).json({ 
        error: 'Server error fetching universities',
        details: error.message 
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: universities,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ 
      error: 'Server error fetching universities',
      details: error.message 
    });
  }
};

// Get university by ID
const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: university, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching university:', error);
      return res.status(404).json({ error: 'University not found' });
    }

    res.status(200).json({ university });
  } catch (error) {
    console.error('Get university error:', error);
    res.status(500).json({ error: 'Server error fetching university' });
  }
};

// Create new university (Admin only)
const createUniversity = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { 
      name,
      description,
      country,
      city,
      state,
      address,
      website,
      contact_email,
      contact_phone,
      established_year,
      type,
      ranking,
      tuition_fee,
      application_fee,
      acceptance_rate,
      student_population,
      faculty_count,
      programs_offered,
      facilities,
      image,
      logo,
      gallery,
      campus_size,
      campus_type,
      accreditation,
      notable_alumni,
      keywords,
      region,
      ranking_type,
      ranking_year
    } = req.body;
    
    console.log('Extracted fields:', { name, country, city, type });
    
    // Use authenticated user ID if available
    const createdBy = req.userId || 'bca2f806-29c5-4be9-bc2d-a484671546cd';
    
    // Generate slug from name
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    
    const insertData = {
      name,
      description: description || '',
      country,
      city: city || '',
      state: state || null,
      address: address || null,
      website: website || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      established_year: established_year ? parseInt(established_year) : null,
      type: type || 'public',
      ranking: ranking ? parseInt(ranking) : null,
      tuition_fee: tuition_fee ? parseFloat(tuition_fee) : null,
      application_fee: application_fee ? parseFloat(application_fee) : null,
      acceptance_rate: acceptance_rate ? parseFloat(acceptance_rate) : null,
      student_population: student_population ? parseInt(student_population) : null,
      faculty_count: faculty_count ? parseInt(faculty_count) : null,
      programs_offered: programs_offered || [],
      facilities: facilities || [],
      image: image || null,
      logo: logo || null,
      gallery: gallery || [],
      campus_size: campus_size || null,
      campus_type: campus_type || null,
      accreditation: accreditation || null,
      notable_alumni: notable_alumni || [],
      slug,
      keywords: keywords || [],
      region: region || null,
      ranking_type: ranking_type || null,
      ranking_year: ranking_year ? parseInt(ranking_year) : null
    };

    console.log('Insert data:', insertData);

    // Try to create university with created_by field first
    let { data: university, error } = await supabaseAdmin()
      .from('universities')
      .insert([{ ...insertData, created_by: createdBy }])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating university with created_by:', error);
      
      // If created_by column doesn't exist or causes constraint issues, try without it
      if (error.message.includes('created_by') || error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('Trying to create university without created_by field...');
        
        const { data: university2, error: error2 } = await supabaseAdmin()
          .from('universities')
          .insert([insertData])
          .select()
          .single();
          
        if (error2) {
          console.error('Supabase error creating university without created_by:', error2);
          return res.status(500).json({ 
            error: 'Failed to create university', 
            details: error2.message 
          });
        }
        
        university = university2;
        console.log('University created successfully without created_by field:', university);
      } else {
        return res.status(500).json({ 
          error: 'Failed to create university', 
          details: error.message 
        });
      }
    } else {
      console.log('University created successfully with created_by field:', university);
    }
    
    if (!university) {
      return res.status(500).json({ 
        error: 'Failed to create university', 
        details: 'No university data returned from database'
      });
    }
    
    res.status(201).json({ 
      message: 'University created successfully', 
      data: university 
    });
  } catch (error) {
    console.error('Create university error:', error);
    res.status(500).json({ error: 'Server error creating university', details: error.message });
  }
};

// Update university (Admin only)
const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      uid,
      name,
      description,
      country,
      city,
      state,
      address,
      website,
      contact_email,
      contact_phone,
      established_year,
      type,
      ranking,
      tuition_fee,
      application_fee,
      acceptance_rate,
      student_population,
      faculty_count,
      programs_offered,
      facilities,
      image,
      logo,
      gallery,
      campus_size,
      campus_type,
      accreditation,
      notable_alumni,
      keywords,
      region,
      ranking_type,
      ranking_year,
      // New admission requirements fields
      min_gpa_required,
      sat_score_required,
      act_score_required,
      ielts_score_required,
      toefl_score_required,
      gre_score_required,
      gmat_score_required,
      // Application deadlines
      application_deadline_fall,
      application_deadline_spring,
      application_deadline_summer,
      // Financial information
      tuition_fee_graduate,
      scholarship_available,
      financial_aid_available,
      // Additional admission requirements
      application_requirements,
      admission_essay_required,
      letters_of_recommendation_required,
      interview_required,
      work_experience_required,
      portfolio_required
    } = req.body;

    // First check if the university exists
    const { data: existingUniversity, error: fetchError } = await supabase
      .from('universities')
      .select('created_by, slug, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingUniversity) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Generate new slug if name changed
    let slug = existingUniversity.slug;
    if (name && name !== existingUniversity.name) {
      slug = await generateUniqueSlug(name);
    }

    // Update the university using admin client (admin can update any university)
    const { data: updatedUniversity, error } = await supabaseAdmin
      .from('universities')
      .update({
        name,
        description,
        country,
        city,
        state,
        address,
        website,
        contact_email,
        contact_phone,
        established_year: established_year ? parseInt(established_year) : null,
        type,
        ranking: ranking ? parseInt(ranking) : null,
        tuition_fee: tuition_fee ? parseFloat(tuition_fee) : null,
        application_fee: application_fee ? parseFloat(application_fee) : null,
        acceptance_rate: acceptance_rate ? parseFloat(acceptance_rate) : null,
        student_population: student_population ? parseInt(student_population) : null,
        faculty_count: faculty_count ? parseInt(faculty_count) : null,
        programs_offered: programs_offered || [],
        facilities: facilities || [],
        image,
        logo,
        gallery: gallery || [],
        campus_size,
        campus_type,
        accreditation,
        notable_alumni: notable_alumni || [],
        slug,
        keywords: keywords || [],
        region,
        ranking_type,
        ranking_year: ranking_year ? parseInt(ranking_year) : null,
        // New admission requirements fields
        min_gpa_required: min_gpa_required ? parseFloat(min_gpa_required) : null,
        sat_score_required,
        act_score_required,
        ielts_score_required,
        toefl_score_required,
        gre_score_required,
        gmat_score_required,
        // Application deadlines
        application_deadline_fall,
        application_deadline_spring,
        application_deadline_summer,
        // Financial information
        tuition_fee_graduate: tuition_fee_graduate ? parseInt(tuition_fee_graduate) : null,
        scholarship_available: scholarship_available || false,
        financial_aid_available: financial_aid_available || false,
        // Additional admission requirements
        application_requirements: application_requirements || [],
        admission_essay_required: admission_essay_required || false,
        letters_of_recommendation_required: letters_of_recommendation_required ? parseInt(letters_of_recommendation_required) : 0,
        interview_required: interview_required || false,
        work_experience_required: work_experience_required || false,
        portfolio_required: portfolio_required || false,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating university:', error);
      return res.status(500).json({ error: 'Failed to update university' });
    }

    res.status(200).json({
      message: 'University updated successfully',
      university: updatedUniversity
    });
  } catch (error) {
    console.error('Update university error:', error);
    res.status(500).json({ error: 'Server error updating university' });
  }
};

// Delete university (Admin only)
const deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;

    // First check if the university exists
    const { data: existingUniversity, error: fetchError } = await supabase
      .from('universities')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingUniversity) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Delete the university using admin client (admin can delete any university)
    const { error } = await supabaseAdmin
      .from('universities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting university:', error);
      return res.status(500).json({ error: 'Failed to delete university' });
    }

    res.status(200).json({
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Delete university error:', error);
    res.status(500).json({ error: 'Server error deleting university' });
  }
};

// Get universities by country
const getUniversitiesByCountry = async (req, res) => {
  try {
    const { country } = req.params;

    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .eq('country', country)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching universities by country:', error);
      return res.status(500).json({ error: 'Failed to fetch universities by country' });
    }

    res.status(200).json({ universities });
  } catch (error) {
    console.error('Get universities by country error:', error);
    res.status(500).json({ error: 'Server error fetching universities by country' });
  }
};

// Search universities
const searchUniversities = async (req, res) => {
  try {
    const { query } = req.params;
    const { country, minRanking, maxTuition } = req.query;

    let searchQuery = supabase
      .from('universities')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`);

    // Apply additional filters
    if (country) {
      searchQuery = searchQuery.eq('country', country);
    }

    if (minRanking) {
      searchQuery = searchQuery.lte('ranking', minRanking);
    }

    if (maxTuition) {
      searchQuery = searchQuery.lte('tuition_fee', maxTuition);
    }

    const { data: universities, error } = await searchQuery
      .order('ranking', { ascending: true });

    if (error) {
      console.error('Error searching universities:', error);
      return res.status(500).json({ error: 'Failed to search universities' });
    }

    res.status(200).json({ universities });
  } catch (error) {
    console.error('Search universities error:', error);
    res.status(500).json({ error: 'Server error searching universities' });
  }
};

// Get university countries
const getUniversityCountries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('country')
      .order('country');

    if (error) {
      console.error('Error fetching university countries:', error);
      return res.status(500).json({ error: 'Failed to fetch university countries' });
    }

    // Extract unique countries
    const countries = [...new Set(data.map(university => university.country))];

    res.status(200).json({ countries });
  } catch (error) {
    console.error('Get university countries error:', error);
    res.status(500).json({ error: 'Server error fetching university countries' });
  }
};

export {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByCountry,
  searchUniversities,
  getUniversityCountries
}; 