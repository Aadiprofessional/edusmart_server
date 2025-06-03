const { supabase, supabaseAdmin } = require('../utils/supabase');

// Register a new user using Supabase Auth
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth registration error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger, if not create it manually
    let profile = null;
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      profile = existingProfile;
    } catch (error) {
      // Profile doesn't exist, create it manually using admin client
      console.log('Profile not found, creating manually...');
      try {
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: name,
              role: 'user'
            }
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Manual profile creation error:', profileError);
          // Continue anyway, profile creation is not critical for registration
        } else {
          profile = newProfile;
        }
      } catch (manualError) {
        console.error('Manual profile creation failed:', manualError);
        // Continue anyway
      }
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        email_confirmed: authData.user.email_confirmed_at ? true : false,
        profile_created: !!profile
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login user using Supabase Auth
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase Auth login error:', authError);
      return res.status(401).json({ error: authError.message });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile from our profiles table
    let profile = null;
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('id', authData.user.id)
        .single();
      
      profile = existingProfile;
    } catch (profileError) {
      console.error('Profile fetch error:', profileError);
      // Try to create profile if it doesn't exist
      try {
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || 'User',
              role: 'user'
            }
          ])
          .select()
          .single();
        
        profile = newProfile;
      } catch (createError) {
        console.error('Profile creation during login failed:', createError);
        // Continue without profile
      }
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.name || authData.user.user_metadata?.name || 'User',
        role: profile?.role || 'user',
        email_confirmed: authData.user.email_confirmed_at ? true : false
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user profile using Supabase Auth
const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Get user from Supabase Auth using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from our profiles table
    let profile = null;
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at, avatar_url')
        .eq('id', user.id)
        .single();
      
      profile = existingProfile;
    } catch (profileError) {
      console.error('Profile fetch error:', profileError);
      // Try to create profile if it doesn't exist
      try {
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || 'User',
              role: 'user'
            }
          ])
          .select('id, email, name, role, created_at, avatar_url')
          .single();
        
        profile = newProfile;
      } catch (createError) {
        console.error('Profile creation failed:', createError);
        return res.status(404).json({ error: 'Profile not found and could not be created' });
      }
    }

    res.status(200).json({ 
      user: {
        ...profile,
        email_confirmed: user.email_confirmed_at ? true : false
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Token refreshed successfully',
      session: data.session
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Server error refreshing token' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
  refreshToken
}; 