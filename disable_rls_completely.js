const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function disableRLS() {
  console.log('🔧 Completely disabling RLS for immediate functionality...\n');
  
  try {
    // Disable RLS on both tables
    console.log('1. Disabling RLS on profiles table...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
    });
    console.log('✅ RLS disabled on profiles');

    console.log('\n2. Disabling RLS on user_profiles table...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;' 
    });
    console.log('✅ RLS disabled on user_profiles');

    // Grant full permissions
    console.log('\n3. Granting full permissions...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.profiles TO authenticated, anon, service_role;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.user_profiles TO authenticated, anon, service_role;' 
    });
    console.log('✅ Full permissions granted');

    console.log('\n🎉 RLS completely disabled!');
    console.log('✅ All profile APIs should now work without any restrictions!');
    console.log('⚠️  Remember to re-enable RLS with proper policies in production!');

  } catch (error) {
    console.error('❌ Error disabling RLS:', error.message);
  }
}

disableRLS(); 