const axios = require('axios');

const BASE_URL = 'https://edusmart-server.vercel.app';

async function getAuthToken() {
  try {
    console.log('🔐 Attempting to get authentication token...\n');
    
    // Test credentials - you'll need to replace these with actual credentials
    const loginData = {
      email: 'testuser@gmail.com',
      password: 'testpassword123'
    };
    
    console.log('Attempting login with:', loginData.email);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.session && response.data.session.access_token) {
      console.log('✅ Login successful!');
      console.log('User:', response.data.user);
      console.log('\n🎫 Access Token:');
      console.log(response.data.session.access_token);
      console.log('\n📋 Copy this token and replace TEST_TOKEN in test_user_profile_apis.js');
      
      return response.data.session.access_token;
    } else {
      console.log('❌ Login failed - no token received');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    
    console.log('\n📝 To get a valid token, you need to:');
    console.log('1. Register a user first using /api/auth/register');
    console.log('2. Or use existing credentials');
    console.log('3. Update the loginData in this script with valid credentials');
  }
}

async function registerTestUser() {
  try {
    console.log('👤 Attempting to register test user...\n');
    
    const registerData = {
      email: 'testuser@gmail.com',
      password: 'testpassword123',
      name: 'Test User'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, registerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
    
    if (response.data.session && response.data.session.access_token) {
      console.log('\n🎫 Access Token from registration:');
      console.log(response.data.session.access_token);
      return response.data.session.access_token;
    }
    
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('EDUSMART AUTH TOKEN GENERATOR');
  console.log('='.repeat(60));
  console.log('');
  
  // Try to login first
  let token = await getAuthToken();
  
  if (!token) {
    console.log('\n' + '='.repeat(60));
    console.log('LOGIN FAILED - TRYING REGISTRATION');
    console.log('='.repeat(60));
    console.log('');
    
    // If login fails, try to register
    token = await registerTestUser();
  }
  
  if (token) {
    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS! Token obtained.');
    console.log('='.repeat(60));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('FAILED to obtain token.');
    console.log('='.repeat(60));
  }
}

main().catch(console.error); 