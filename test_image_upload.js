const { supabaseAdmin } = require('./src/utils/supabase');

async function testImageUpload() {
  console.log('🧪 Testing Image Upload to Supabase...\n');

  try {
    // Create a minimal PNG image buffer (1x1 pixel transparent PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);

    const testFileName = `test-${Date.now()}.png`;
    const testFilePath = `test/${testFileName}`;

    console.log('1. Uploading test PNG image...');
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('university-images')
      .upload(testFilePath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }
    console.log('✅ Upload successful:', uploadData.path);

    // Get public URL
    console.log('2. Generating public URL...');
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('university-images')
      .getPublicUrl(testFilePath);

    console.log('✅ Public URL:', publicUrl);

    // Test if URL is accessible
    console.log('3. Testing URL accessibility...');
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        console.log('✅ Image is publicly accessible');
      } else {
        console.log('⚠️  Image URL returned status:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️  Could not test URL accessibility:', fetchError.message);
    }

    // Clean up
    console.log('4. Cleaning up test file...');
    const { error: deleteError } = await supabaseAdmin.storage
      .from('university-images')
      .remove([testFilePath]);

    if (deleteError) {
      console.error('⚠️  Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Image upload test completed successfully!');
    console.log('Your upload API should now work with real images.');
    console.log('\n📝 Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Test the frontend logo upload');
    console.log('3. Images will now be saved to Supabase instead of local storage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testImageUpload(); 