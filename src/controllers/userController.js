import { supabaseAdmin } from '../utils/supabase.js';

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { data: profiles, error } = await supabaseAdmin()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove protected fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // Map full_name to name if provided
    if (updateData.full_name) {
      updateData.name = updateData.full_name;
      delete updateData.full_name;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin()
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update user',
        error: error.message 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: user,
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating user',
      error: error.message 
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete user profile
    const { error } = await supabaseAdmin()
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin()
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get admin users count
    const { count: adminUsers, error: adminError } = await supabaseAdmin()
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminError) throw adminError;

    // Get users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth, error: newUsersError } = await supabaseAdmin()
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (newUsersError) throw newUsersError;

    // For active users, just use total users since we don't have applications table
    const activeUsers = totalUsers;

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeUsers: activeUsers || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

export {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
}; 