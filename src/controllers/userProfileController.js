const { supabase } = require('../utils/supabase');

// Calculate profile completion percentage based on actual database fields
const calculateProfileCompletion = (profile) => {
  // Based on your actual user_profiles table schema
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
    const authUserId = req.userId; // This is from auth.users.id
    const profileData = { ...req.body };

    // Remove protected fields
    delete profileData.user_id;
    delete profileData.id;
    delete profileData.created_at;

    // First, get or create the user's profile record
    let { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', authUserId)
      .single();

    if (profileError || !userProfile) {
      // Create profile record if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          id: authUserId,
          email: req.userEmail,
          name: profileData.full_name || '',
          role: 'user',
          created_at: new Date(),
          updated_at: new Date()
        }])
        .select()
        .single();

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
        return res.status(400).json({ error: 'Failed to create user profile: ' + createProfileError.message });
      }
      userProfile = newProfile;
    }

    // Sanitize data - handle empty strings and null values
    const sanitizeData = (data) => {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Handle date fields - convert empty strings to null
        if (key === 'date_of_birth' && (value === '' || value === null || value === undefined)) {
          sanitized[key] = null;
        }
        // Handle numeric fields - convert empty strings to null
        else if (['current_gpa', 'sat_score', 'act_score', 'gre_score', 'gmat_score', 'toefl_score', 'ielts_score', 'duolingo_score'].includes(key)) {
          if (value === '' || value === null || value === undefined || value === 0) {
            sanitized[key] = null;
          } else {
            sanitized[key] = value;
          }
        }
        // Handle boolean fields
        else if (key === 'financial_aid_needed') {
          sanitized[key] = Boolean(value);
        }
        // Handle JSONB arrays
        else if (['extracurricular_activities', 'languages'].includes(key)) {
          if (Array.isArray(value)) {
            sanitized[key] = value;
          } else if (typeof value === 'string' && value.trim()) {
            // Convert comma-separated string to array
            sanitized[key] = value.split(',').map(item => item.trim()).filter(item => item);
          } else {
            sanitized[key] = [];
          }
        }
        // Handle string fields
        else if (typeof value === 'string' || value === null || value === undefined) {
          sanitized[key] = value || '';
        }
        // Keep other values as is
        else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    const sanitizedData = sanitizeData(profileData);

    // Check if user_profile already exists (using profiles.id as user_id)
    const { data: existingUserProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userProfile.id)
      .single();

    let result;
    if (existingUserProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedData,
          updated_at: new Date()
        })
        .eq('user_id', userProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return res.status(400).json({ error: error.message });
      }
      result = data;
    } else {
      // Create new profile (user_id references profiles.id)
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userProfile.id,
          ...sanitizedData,
          created_at: new Date()
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
      .eq('user_id', userProfile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Completion update error:', updateError);
      // Continue anyway, just log the error
    }

    res.status(existingUserProfile ? 200 : 201).json({
      message: existingUserProfile ? 'Profile updated successfully' : 'Profile created successfully',
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
    const authUserId = req.userId; // This is from auth.users.id

    // First get the user's profile record to get the profiles.id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', authUserId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Now get the detailed user_profile using profiles.id
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userProfile.id)
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
    const authUserId = req.userId;
    const updates = { ...req.body };

    // Remove protected fields
    delete updates.user_id;
    delete updates.id;
    delete updates.created_at;

    // Add updated timestamp
    updates.updated_at = new Date();

    // Get the user's profile record to get the profiles.id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userProfile.id)
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
      .eq('user_id', userProfile.id)
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
    const authUserId = req.userId;

    // Get the user's profile record to get the profiles.id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userProfile.id);

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
    const authUserId = req.userId;

    // Get the user's profile record to get the profiles.id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('profile_completion_percentage, updated_at')
      .eq('user_id', userProfile.id)
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