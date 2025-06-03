const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all universities
const getAllUniversities = async (req, res) => {
  try {
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch universities',
      error: error.message
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

    if (error) throw error;

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch university',
      error: error.message
    });
  }
};

// Create new university
const createUniversity = async (req, res) => {
  try {
    const universityData = req.body;

    const { data: university, error } = await supabase
      .from('universities')
      .insert([universityData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: university,
      message: 'University created successfully'
    });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create university',
      error: error.message
    });
  }
};

// Update university
const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: university, error } = await supabase
      .from('universities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: university,
      message: 'University updated successfully'
    });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update university',
      error: error.message
    });
  }
};

// Delete university
const deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete university',
      error: error.message
    });
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

    if (error) throw error;

    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error fetching universities by country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch universities by country',
      error: error.message
    });
  }
};

// Search universities
const searchUniversities = async (req, res) => {
  try {
    const { query } = req.params;

    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .or(`name.ilike.%${query}%,country.ilike.%${query}%,city.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error searching universities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search universities',
      error: error.message
    });
  }
};

module.exports = {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByCountry,
  searchUniversities
}; 