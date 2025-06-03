const supabase = require('../utils/supabase');
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

// Create a new scholarship
const createScholarship = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      amount, 
      eligibility, 
      deadline, 
      university, 
      country, 
      application_link,
      requirements,
      uid 
    } = req.body;
    
    // Create a new scholarship entry
    const { data: scholarship, error } = await supabase
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
          created_by: uid,
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

// Update an existing scholarship
const updateScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      amount, 
      eligibility, 
      deadline, 
      university, 
      country, 
      application_link,
      requirements,
      uid 
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
    
    // Check if user is the creator or has admin role
    if (existingScholarship.created_by !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this scholarship' });
    }
    
    // Update the scholarship
    const { data: updatedScholarship, error } = await supabase
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

// Delete a scholarship
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
    
    // Check if user is the creator or has admin role
    if (existingScholarship.created_by !== uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this scholarship' });
    }
    
    // Delete the scholarship
    const { error } = await supabase
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

// Get countries with scholarships
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

// Get universities with scholarships
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