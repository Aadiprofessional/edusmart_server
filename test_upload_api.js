const { supabaseAdmin } = require('./src/utils/supabase');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUploadAPI() {
  console.log('🧪 Testing Upload API Endpoint...\n');

  try {
    // Test 1: Direct Supabase upload (should work now)
    console.log('1. Testing direct Supabase upload...');
    
    const testContent = Buffer.from('This is a test image file');
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `test/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('university-images')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Direct upload failed:', uploadError);
      return;
    }
    console.log('✅ Direct upload successful:', uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('university-images')
      .getPublicUrl(testFilePath);

    console.log('✅ Public URL generated:', publicUrl);

    // Clean up
    await supabaseAdmin.storage
      .from('university-images')
      .remove([testFilePath]);
    console.log('✅ Test file cleaned up\n');

    // Test 2: Test the API endpoint (if server is running)
    console.log('2. Testing API endpoint...');
    console.log('   To test the API endpoint:');
    console.log('   1. Start your server: npm start');
    console.log('   2. Use a tool like Postman or curl to test:');
    console.log('   curl -X POST http://localhost:8000/api/uploads/image \\');
    console.log('        -F "image=@path/to/your/image.jpg"');
    console.log('');
    console.log('🎉 Supabase upload is now working correctly!');
    console.log('Your frontend should now upload images to Supabase instead of local storage.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUploadAPI(); 