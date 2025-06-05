const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all scholarships with pagination and filtering
const getScholarships = async (req, res) => {
  try {
    const { page = 1, limit = 10, country, minAmount, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('scholarships')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (country) {
      query = query.eq('country', country);
    }
    
    if (minAmount) {
      query = query.gte('amount', minAmount);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,university.ilike.%${search}%`);
    }
    
    // Apply pagination
    const { data: scholarships, error, count } = await query
      .order('deadline', { ascending: true })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching scholarships:', error);
      return res.status(500).json({ error: 'Failed to fetch scholarships' });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      scholarships,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get scholarships error:', error);
    res.status(500).json({ error: 'Server error fetching scholarships' });
  }
};

// Get a single scholarship by ID
const getScholarshipById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: scholarship, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching scholarship:', error);
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    res.status(200).json({ scholarship });
  } catch (error) {
    console.error('Get scholarship error:', error);
    res.status(500).json({ error: 'Server error fetching scholarship' });
  }
};

// Create a new scholarship (Admin only)
const createScholarship = async (req, res) => {
  try {
    const { 
      uid,
      title, 
      description, 
      amount, 
      eligibility, 
      deadline, 
      university, 
      country, 
      application_link,
      requirements,
      image
    } = req.body;
    
    // The UID has already been verified by checkAdminByUid middleware
    const createdBy = uid;
    
    // Use admin client to bypass RLS for admin operations
    const { data: scholarship, error } = await supabaseAdmin
      .from('scholarships')
      .insert([
        {
          id: uuidv4(),
          title,
          description,
          amount,
          eligibility,
          deadline,
          university,
          country,
          application_link,
          requirements,
          image,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating scholarship:', error);
      return res.status(500).json({ error: 'Failed to create scholarship' });
    }
    
    res.status(201).json({ 
      message: 'Scholarship created successfully', 
      scholarship 
    });
  } catch (error) {
    console.error('Create scholarship error:', error);
    res.status(500).json({ error: 'Server error creating scholarship' });
  }
};

// Update an existing scholarship (Admin only)
const updateScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title, 
      description, 
      amount, 
      eligibility, 
      deadline, 
      university, 
      country, 
      application_link,
      requirements,
      image
    } = req.body;
    
    // First check if the scholarship exists
    const { data: existingScholarship, error: fetchError } = await supabase
      .from('scholarships')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingScholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    // Update the scholarship using admin client (admin can update any scholarship)
    const { data: updatedScholarship, error } = await supabaseAdmin
      .from('scholarships')
      .update({
        title,
        description,
        amount,
        eligibility,
        deadline,
        university,
        country,
        application_link,
        requirements,
        image,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating scholarship:', error);
      return res.status(500).json({ error: 'Failed to update scholarship' });
    }
    
    res.status(200).json({ 
      message: 'Scholarship updated successfully', 
      scholarship: updatedScholarship 
    });
  } catch (error) {
    console.error('Update scholarship error:', error);
    res.status(500).json({ error: 'Server error updating scholarship' });
  }
};

// Delete a scholarship (Admin only)
const deleteScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the scholarship exists
    const { data: existingScholarship, error: fetchError } = await supabase
      .from('scholarships')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingScholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    // Delete the scholarship using admin client (admin can delete any scholarship)
    const { error } = await supabaseAdmin
      .from('scholarships')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting scholarship:', error);
      return res.status(500).json({ error: 'Failed to delete scholarship' });
    }
    
    res.status(200).json({ 
      message: 'Scholarship deleted successfully'
    });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    res.status(500).json({ error: 'Server error deleting scholarship' });
  }
};

// Get scholarship countries
const getScholarshipCountries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarships')
      .select('country')
      .order('country');
      
    if (error) {
      console.error('Error fetching scholarship countries:', error);
      return res.status(500).json({ error: 'Failed to fetch scholarship countries' });
    }
    
    // Extract unique countries
    const countries = [...new Set(data.map(scholarship => scholarship.country))];
    
    res.status(200).json({ countries });
  } catch (error) {
    console.error('Get scholarship countries error:', error);
    res.status(500).json({ error: 'Server error fetching scholarship countries' });
  }
};

// Get scholarship universities
const getScholarshipUniversities = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarships')
      .select('university')
      .order('university');
      
    if (error) {
      console.error('Error fetching scholarship universities:', error);
      return res.status(500).json({ error: 'Failed to fetch scholarship universities' });
    }
    
    // Extract unique universities
    const universities = [...new Set(data.map(scholarship => scholarship.university))];
    
    res.status(200).json({ universities });
  } catch (error) {
    console.error('Get scholarship universities error:', error);
    res.status(500).json({ error: 'Server error fetching scholarship universities' });
  }
};

module.exports = {
  getScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getScholarshipCountries,
  getScholarshipUniversities
}; 