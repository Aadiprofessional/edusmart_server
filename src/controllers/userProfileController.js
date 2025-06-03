const { supabase } = require('../utils/supabase');

// Calculate profile completion percentage
const calculateProfileCompletion = (profile) => {
  const fields = [
    'full_name', 'email', 'phone', 'date_of_birth', 'nationality',
    'current_location', 'preferred_study_location', 'current_education_level',
    'current_institution', 'current_gpa', 'gpa_scale', 'graduation_year',
    'field_of_study', 'preferred_field', 'preferred_degree_level',
    'budget_range', 'preferred_university_size', 'preferred_campus_type',
    'preferred_program_type', 'career_goals', 'work_experience'
  ];

  const filledFields = fields.filter(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((filledFields.length / fields.length) * 100);
};

// Create or update user profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = { ...req.body };

    // Remove user_id from profileData if it exists (we'll set it ourselves)
    delete profileData.user_id;
    delete profileData.id;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return res.status(400).json({ error: error.message });
      }
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          ...profileData
        }])
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return res.status(400).json({ error: error.message });
      }
      result = data;
    }

    // Calculate and update completion percentage
    const completionPercentage = calculateProfileCompletion(result);
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_completion_percentage: completionPercentage })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Completion update error:', updateError);
      // Continue anyway, just log the error
    }

    res.status(existingProfile ? 200 : 201).json({
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      profile: updatedProfile || result
    });
  } catch (error) {
    console.error('Create/Update profile error:', error);
    res.status(500).json({ error: 'Server error managing profile' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' });
      }
      console.error('Get profile error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// Update specific profile fields
const updateProfileFields = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = { ...req.body };

    // Remove protected fields
    delete updates.user_id;
    delete updates.id;
    delete updates.created_at;

    // Add updated timestamp
    updates.updated_at = new Date();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update fields error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Recalculate completion percentage
    const completionPercentage = calculateProfileCompletion(profile);
    
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .update({ profile_completion_percentage: completionPercentage })
      .eq('user_id', userId)
      .select()
      .single();

    res.status(200).json({
      message: 'Profile fields updated successfully',
      profile: updatedProfile || profile
    });
  } catch (error) {
    console.error('Update profile fields error:', error);
    res.status(500).json({ error: 'Server error updating profile fields' });
  }
};

// Delete user profile
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Delete profile error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Server error deleting profile' });
  }
};

// Get profile completion status
const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('profile_completion_percentage, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json({ 
          completion_percentage: 0,
          message: 'No profile found. Create a profile to get started.'
        });
      }
      console.error('Get completion error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      completion_percentage: profile.profile_completion_percentage || 0,
      last_updated: profile.updated_at
    });
  } catch (error) {
    console.error('Get completion error:', error);
    res.status(500).json({ error: 'Server error fetching completion status' });
  }
};

module.exports = {
  createOrUpdateProfile,
  getUserProfile,
  updateProfileFields,
  deleteUserProfile,
  getProfileCompletion
}; 