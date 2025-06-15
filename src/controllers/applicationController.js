import { supabase, supabaseAdmin } from '../utils/supabase.js';

// Get all applications with pagination
const getAllApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get applications with basic user info
    const { data: applications, error, count } = await supabaseAdmin()
      .from('applications')
      .select('*, profiles:user_id(name, email)', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: error.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .select('*, profiles:user_id(name, email)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Create new application
const createApplication = async (req, res) => {
  try {
    const applicationData = { ...req.body };
    
    // Use authenticated user ID if available
    if (req.userId) {
      applicationData.user_id = req.userId;
    }
    
    // Remove protected fields
    delete applicationData.id;
    delete applicationData.created_at;
    delete applicationData.updated_at;

    // Set default values for required fields
    const insertData = {
      user_id: applicationData.user_id,
      type: applicationData.type || 'general',
      status: applicationData.status || 'pending',
      data: applicationData.data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create application',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application created successfully'
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove protected fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.user_id;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application updated successfully'
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin()
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

// Get applications by user
const getApplicationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: applications, error } = await supabaseAdmin()
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user applications',
      error: error.message
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: application,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// Get application statistics
const getApplicationStats = async (req, res) => {
  try {
    const { data: applications, error } = await supabaseAdmin()
      .from('applications')
      .select('status');

    if (error) throw error;

    const stats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: applications.length,
        ...stats
      }
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics',
      error: error.message
    });
  }
};

// Get applications by status
const getApplicationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const { data: applications, error } = await supabaseAdmin()
      .from('applications')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by status',
      error: error.message
    });
  }
};

const applicationController = {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByUser,
  updateApplicationStatus,
  getApplicationStats,
  getApplicationsByStatus
};

export default applicationController; 