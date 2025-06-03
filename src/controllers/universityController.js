const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all universities with pagination and filtering
const getAllUniversities = async (req, res) => {
  try {
    const { page = 1, limit = 10, country, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('universities')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (country) {
      query = query.eq('country', country);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`);
    }
    
    // Apply pagination
    const { data: universities, error, count } = await query
      .order('name', { ascending: true })
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
      website,
      ranking,
      tuition_fee,
      acceptance_rate,
      student_population,
      established_year,
      image,
      programs_offered
    } = req.body;

    // The UID has already been verified by checkAdminByUid middleware
    const createdBy = uid;

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
          website,
          ranking,
          tuition_fee,
          acceptance_rate,
          student_population,
          established_year,
          image,
          programs_offered,
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
      website,
      ranking,
      tuition_fee,
      acceptance_rate,
      student_population,
      established_year,
      image,
      programs_offered
    } = req.body;

    // First check if the university exists
    const { data: existingUniversity, error: fetchError } = await supabase
      .from('universities')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingUniversity) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Update the university using admin client (admin can update any university)
    const { data: updatedUniversity, error } = await supabaseAdmin
      .from('universities')
      .update({
        name,
        description,
        country,
        city,
        website,
        ranking,
        tuition_fee,
        acceptance_rate,
        student_population,
        established_year,
        image,
        programs_offered,
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

module.exports = {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByCountry,
  searchUniversities,
  getUniversityCountries
}; 