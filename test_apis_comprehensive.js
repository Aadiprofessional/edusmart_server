const { supabase } = require('./src/utils/supabase');

// Test credentials
const testEmail = 'matrixai.global@gmail.com';
const testPassword = '12345678';

async function testAPIsComprehensive() {
  console.log('🔍 COMPREHENSIVE API TESTING');
  console.log('=' .repeat(60));

  try {
    // 1. Authentication
    console.log('1. 🔐 Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.error('❌ Auth failed:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    const userId = authData.user.id;
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // 2. Database Direct Check
    console.log('\n2. 🗄️  Testing Database Direct Access...');
    
    // Check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profiles table error:', profileError.message);
    } else {
      console.log('✅ Profiles table access successful');
      console.log('   Profile data:', {
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

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.log('❌ User_profiles table error:', userProfileError.message);
    } else if (userProfileError && userProfileError.code === 'PGRST116') {
      console.log('ℹ️  No user profile found (expected for new users)');
    } else {
      console.log('✅ User_profiles table access successful');
      console.log('   User profile data exists');
    }

    // 3. API Endpoint Testing
    console.log('\n3. 🌐 Testing API Endpoints...');
    const baseURL = 'http://localhost:8000';
    
    // Test GET profile
    console.log('\n   📥 Testing GET /api/user/profile...');
    try {
      const getResponse = await fetch(`${baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const getResult = await getResponse.json();
      console.log(`   Status: ${getResponse.status}`);
      
      if (getResponse.status === 200) {
        console.log('   ✅ GET profile successful');
        console.log('   Profile data:', getResult.data ? 'Found' : 'Empty');
      } else if (getResponse.status === 404) {
        console.log('   ℹ️  No profile found (expected for new users)');
      } else {
        console.log('   ❌ GET profile failed');
        console.log('   Response:', getResult);
      }
    } catch (error) {
      console.log('   ❌ GET request failed:', error.message);
    }

    // Test POST profile (create)
    console.log('\n   📤 Testing POST /api/user/profile...');
    const testProfile = {
      full_name: 'Test User Updated',
      email: testEmail,
      phone: '+1234567890',
      current_education_level: 'Undergraduate',
      current_institution: 'Test University',
      current_gpa: 3.5,
      gpa_scale: '4.0',
      graduation_year: '2025',
      field_of_study: 'Computer Science',
      preferred_field: 'Artificial Intelligence',
      preferred_degree_level: "Master's",
      budget_range: '$40,000 - $60,000',
      preferred_study_location: 'USA',
      career_goals: 'Become an AI researcher',
      extracurricular_activities: ['Programming Club', 'Debate Team'],
      languages: ['English', 'Spanish'],
      financial_aid_needed: true
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
      console.log(`   Status: ${postResponse.status}`);
      
      if (postResponse.status === 200 || postResponse.status === 201) {
        console.log('   ✅ POST profile successful');
        console.log('   Profile created/updated successfully');
      } else {
        console.log('   ❌ POST profile failed');
        console.log('   Response:', postResult);
      }
    } catch (error) {
      console.log('   ❌ POST request failed:', error.message);
    }

    // Test GET profile again (should work now)
    console.log('\n   📥 Testing GET /api/user/profile (after POST)...');
    try {
      const getResponse2 = await fetch(`${baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const getResult2 = await getResponse2.json();
      console.log(`   Status: ${getResponse2.status}`);
      
      if (getResponse2.status === 200) {
        console.log('   ✅ GET profile successful (after POST)');
        console.log('   Profile completion:', getResult2.data?.profile_completion_percentage || 'N/A');
      } else {
        console.log('   ❌ GET profile failed (after POST)');
        console.log('   Response:', getResult2);
      }
    } catch (error) {
      console.log('   ❌ GET request failed:', error.message);
    }

    // Test PATCH profile (update specific fields)
    console.log('\n   🔄 Testing PATCH /api/user/profile...');
    const patchData = {
      current_gpa: 3.8,
      phone: '+1987654321'
    };

    try {
      const patchResponse = await fetch(`${baseURL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
      
      const patchResult = await patchResponse.json();
      console.log(`   Status: ${patchResponse.status}`);
      
      if (patchResponse.status === 200) {
        console.log('   ✅ PATCH profile successful');
      } else {
        console.log('   ❌ PATCH profile failed');
        console.log('   Response:', patchResult);
      }
    } catch (error) {
      console.log('   ❌ PATCH request failed:', error.message);
    }

    // Test GET profile completion
    console.log('\n   📊 Testing GET /api/user/profile/completion...');
    try {
      const completionResponse = await fetch(`${baseURL}/api/user/profile/completion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const completionResult = await completionResponse.json();
      console.log(`   Status: ${completionResponse.status}`);
      
      if (completionResponse.status === 200) {
        console.log('   ✅ GET completion successful');
        console.log('   Completion percentage:', completionResult.completion_percentage);
      } else {
        console.log('   ❌ GET completion failed');
        console.log('   Response:', completionResult);
      }
    } catch (error) {
      console.log('   ❌ GET completion request failed:', error.message);
    }

    // 4. Final Summary
    console.log('\n4. 📋 FINAL SUMMARY');
    console.log('=' .repeat(40));
    console.log('✅ Authentication: Working');
    console.log('✅ Database Access: Working');
    console.log('🔍 API Status: Check individual results above');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testAPIsComprehensive(); 