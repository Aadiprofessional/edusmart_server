const { supabase } = require('./src/utils/supabase');

// Test credentials
const testEmail = 'matrixai.global@gmail.com';
const testPassword = '12345678';

async function testCurrentStatus() {
  console.log('🔍 Testing Current API Status');
  console.log('=' .repeat(50));

  try {
    // 1. Sign in to get auth token
    console.log('1. Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    const userId = authData.user.id;
    console.log('✅ Signed in successfully');
    console.log('   User ID:', userId);

    // 2. Check database tables directly
    console.log('\n2. Checking database tables...');
    
    // Check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('   Profiles table:');
    if (profileError) {
      console.log('   ❌ Error:', profileError.message);
    } else {
      console.log('   ✅ Found profile:', {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role
      });
    }

    // Check user_profiles table
    const { data: userProfileData, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('   User_profiles table:');
    if (userProfileError) {
      console.log('   ❌ Error:', userProfileError.message);
      if (userProfileError.code === 'PGRST116') {
        console.log('   ℹ️  No user profile found (this is expected for new users)');
      }
    } else {
      console.log('   ✅ Found user profile:', {
        id: userProfileData.id,
        user_id: userProfileData.user_id,
        full_name: userProfileData.full_name,
        completion: userProfileData.profile_completion_percentage
      });
    }

    // 3. Test API endpoints
    console.log('\n3. Testing API endpoints...');
    
    const baseURL = 'http://localhost:8000';
    
    // Test GET profile
    console.log('   Testing GET /api/user/profile...');
    try {
      const getResponse = await fetch(`${baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const getResult = await getResponse.json();
      console.log('   Status:', getResponse.status);
      console.log('   Response:', getResult);
    } catch (error) {
      console.log('   ❌ Network error:', error.message);
    }

    // Test POST profile (create)
    console.log('\n   Testing POST /api/user/profile...');
    const testProfile = {
      full_name: 'Test User',
      email: testEmail,
      phone: '+1234567890',
      current_education_level: 'Undergraduate',
      current_institution: 'Test University',
      current_gpa: 3.5,
      gpa_scale: '4.0',
      graduation_year: '2025',
      field_of_study: 'Computer Science',
      preferred_field: 'AI',
      preferred_degree_level: "Master's",
      budget_range: '$40,000 - $60,000',
      preferred_study_location: 'USA'
    };

    try {
      const postResponse = await fetch(`${baseURL}/api/user/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testProfile)
      });
      
      const postResult = await postResponse.json();
      console.log('   Status:', postResponse.status);
      console.log('   Response:', postResult);
    } catch (error) {
      console.log('   ❌ Network error:', error.message);
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd 
              FROM pg_policies 
              WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles')
              ORDER BY tablename, policyname;`
      });

    if (policyError) {
      console.log('   ❌ Could not check policies:', policyError.message);
    } else {
      console.log('   Current RLS policies:', policies);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testCurrentStatus(); 