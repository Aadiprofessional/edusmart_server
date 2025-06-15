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
    const { 
      page = 1, 
      limit = 10, 
      country, 
      search, 
      region,
      state,
      type,
      major,
      rankingType,
      qsRankingRange,
      rankingYear,
      admissionDifficulty,
      campusType,
      studentPopulation,
      acceptanceRate,
      showOnlyOpenApplications
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('universities')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (country) {
      query = query.eq('country', country);
    }

    if (state) {
      query = query.eq('state', state);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (region) {
      query = query.eq('region', region);
    }

    if (major && major !== '') {
      query = query.contains('programs_offered', [major]);
    }

    if (rankingType) {
      query = query.eq('ranking_type', rankingType);
    }

    if (qsRankingRange) {
      const maxRanking = parseInt(qsRankingRange);
      if (!isNaN(maxRanking)) {
        query = query.lte('ranking', maxRanking);
      }
    }

    if (rankingYear) {
      query = query.eq('ranking_year', parseInt(rankingYear));
    }

    if (campusType) {
      query = query.eq('campus_type', campusType);
    }

    // Student population filter
    if (studentPopulation) {
      switch (studentPopulation) {
        case 'small':
          query = query.lte('student_population', 15000);
          break;
        case 'medium':
          query = query.gte('student_population', 15001).lte('student_population', 40000);
          break;
        case 'large':
          query = query.gte('student_population', 40001);
          break;
      }
    }

    // Acceptance rate filter
    if (acceptanceRate) {
      switch (acceptanceRate) {
        case 'low':
          query = query.lte('acceptance_rate', 10);
          break;
        case 'medium':
          query = query.gte('acceptance_rate', 11).lte('acceptance_rate', 50);
          break;
        case 'high':
          query = query.gte('acceptance_rate', 51);
          break;
      }
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%,programs_offered.cs.{${search}}`);
    }
    
    // Apply pagination
    const { data: universities, error, count } = await query
      .order('ranking', { ascending: true, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching universities:', error);
      return res.status(500).json({ error: 'Failed to fetch universities' });
    }

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      universities,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ error: 'Server error fetching universities' });
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

    // The UID has already been verified by checkAdminByUid middleware
    const createdBy = uid;

    // Generate unique slug
    const slug = await generateUniqueSlug(name);

    // Use admin client to bypass RLS for admin operations
    const { data: university, error } = await supabaseAdmin
      .from('universities')
      .insert([
        {
          id: uuidv4(),
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
          status: 'active',
          featured: false,
          verified: false,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating university:', error);
      return res.status(500).json({ error: 'Failed to create university' });
    }

    res.status(201).json({
      message: 'University created successfully',
      university
    });
  } catch (error) {
    console.error('Create university error:', error);
    res.status(500).json({ error: 'Server error creating university' });
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