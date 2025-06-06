const { supabase } = require('./src/utils/supabase');
const fs = require('fs');
const path = require('path');

async function testSupabaseUpload() {
  console.log('🧪 Testing Supabase Upload Functionality...\n');

  try {
    // Test 1: Check if Supabase client is initialized
    console.log('1. Testing Supabase client initialization...');
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    console.log('✅ Supabase client initialized successfully\n');

    // Test 2: Check bucket existence
    console.log('2. Testing bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error accessing buckets:', bucketError);
      return;
    }
    
    const universityImagesBucket = buckets.find(bucket => bucket.name === 'university-images');
    if (!universityImagesBucket) {
      console.error('❌ university-images bucket not found');
      console.log('Available buckets:', buckets.map(b => b.name));
      return;
    }
    console.log('✅ university-images bucket found\n');

    // Test 3: Test file upload with a dummy file
    console.log('3. Testing file upload...');
    
    // Create a simple test file
    const testContent = 'This is a test file for Supabase upload';
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `test/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('university-images')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }
    console.log('✅ File uploaded successfully:', uploadData.path);

    // Test 4: Get public URL
    console.log('4. Testing public URL generation...');
    const { data: { publicUrl } } = supabase.storage
      .from('university-images')
      .getPublicUrl(testFilePath);

    console.log('✅ Public URL generated:', publicUrl);

    // Test 5: Clean up - delete test file
    console.log('5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('university-images')
      .remove([testFilePath]);

    if (deleteError) {
      console.error('⚠️  Warning: Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up successfully');
    }

    console.log('\n🎉 All tests passed! Supabase upload is working correctly.');
    console.log('\nIf the frontend is still saving to local storage, the issue might be:');
    console.log('1. Frontend not calling the correct API endpoint');
    console.log('2. Network issues preventing the upload');
    console.log('3. CORS issues');
    console.log('4. Environment variables not properly set in production');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testSupabaseUpload(); 