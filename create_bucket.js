const { supabaseAdmin } = require('./src/utils/supabase');

async function createBucket() {
  console.log('🪣 Creating university-images bucket...\n');

  try {
    // Create the bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('university-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists!');
      } else {
        console.error('❌ Error creating bucket:', error);
        return;
      }
    } else {
      console.log('✅ Bucket created successfully:', data);
    }

    // List buckets to verify
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('\n📋 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });

    const universityBucket = buckets.find(b => b.name === 'university-images');
    if (universityBucket) {
      console.log('\n🎉 university-images bucket is ready for use!');
      console.log('You can now upload images through your application.');
    }

  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    console.log('\n💡 Alternative: Run the SQL script in your Supabase SQL Editor:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the create_public_bucket.sql script');
  }
}

createBucket(); 