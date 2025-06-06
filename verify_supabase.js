const { supabase, supabaseAdmin } = require('./src/utils/supabase');
require('dotenv').config();

async function verifySupabaseConnection() {
  console.log('🔍 Verifying Supabase Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  WARNING: SUPABASE_KEY and SUPABASE_SERVICE_ROLE_KEY are the same!');
    console.log('   The service role key should be different from the anon key.');
  }
  
  console.log('\n🧪 Testing Connections...\n');

  try {
    // Test regular client
    console.log('1. Testing regular Supabase client...');
    const { data: buckets1, error: error1 } = await supabase.storage.listBuckets();
    
    if (error1) {
      console.log('❌ Regular client failed:', error1.message);
    } else {
      console.log('✅ Regular client connected');
      console.log(`   Found ${buckets1.length} buckets:`, buckets1.map(b => b.name));
    }

    // Test admin client
    console.log('\n2. Testing admin Supabase client...');
    const { data: buckets2, error: error2 } = await supabaseAdmin.storage.listBuckets();
    
    if (error2) {
      console.log('❌ Admin client failed:', error2.message);
    } else {
      console.log('✅ Admin client connected');
      console.log(`   Found ${buckets2.length} buckets:`, buckets2.map(b => b.name));
      
      // Check for university-images bucket specifically
      const universityBucket = buckets2.find(b => b.name === 'university-images');
      if (universityBucket) {
        console.log('✅ university-images bucket found!');
        console.log('   Bucket details:', {
          name: universityBucket.name,
          public: universityBucket.public,
          fileSizeLimit: universityBucket.file_size_limit
        });
      } else {
        console.log('❌ university-images bucket not found');
      }
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }

  console.log('\n📝 Next Steps:');
  console.log('1. If buckets are empty, make sure you have the correct service role key');
  console.log('2. Go to Supabase Dashboard → Settings → API');
  console.log('3. Copy the "service_role" key (not the "anon" key)');
  console.log('4. Update SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.log('5. Run this script again to verify');
}

verifySupabaseConnection(); 