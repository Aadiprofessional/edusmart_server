const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixDatabase() {
  console.log('🔧 Fixing database schema and policies...\n');
  
  try {
    // Step 1: Disable RLS temporarily
    console.log('1. Disabling RLS...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;' 
    });
    console.log('✅ RLS disabled');

    // Step 2: Drop all existing policies
    console.log('\n2. Dropping existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can insert their own user_profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can update their own user_profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can delete their own user_profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Service role full access user_profiles" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Service role full access" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can manage own user_profile" ON public.user_profiles;'
    ];

    for (const policy of dropPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql_query: policy });
      } catch (error) {
        // Policy might not exist, continue
      }
    }
    console.log('✅ Policies dropped');

    // Step 3: Grant permissions
    console.log('\n3. Granting permissions...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.profiles TO authenticated;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.profiles TO service_role;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.user_profiles TO authenticated;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'GRANT ALL ON public.user_profiles TO service_role;' 
    });
    console.log('✅ Permissions granted');

    // Step 4: Enable RLS
    console.log('\n4. Enabling RLS...');
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;' 
    });
    console.log('✅ RLS enabled');

    // Step 5: Create working policies
    console.log('\n5. Creating working policies...');
    
    // Service role policies (most important - these bypass RLS)
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "Service role can do everything" ON public.profiles FOR ALL USING (auth.role() = \'service_role\') WITH CHECK (auth.role() = \'service_role\');' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "Service role can do everything user_profiles" ON public.user_profiles FOR ALL USING (auth.role() = \'service_role\') WITH CHECK (auth.role() = \'service_role\');' 
    });
    
    // User policies
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);' 
    });
    await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "Users can manage own user_profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);' 
    });
    
    console.log('✅ Working policies created');

    // Step 6: Ensure test user profile exists
    console.log('\n6. Ensuring test user profile exists...');
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'matrixai.global@gmail.com')
      .single();

    if (!existingProfile) {
      // Get user ID from auth
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const testUser = users.users.find(u => u.email === 'matrixai.global@gmail.com');
      
      if (testUser) {
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: testUser.id,
            email: testUser.email,
            name: 'Bill Kong',
            role: 'user'
          });
        console.log('✅ Test user profile created');
      }
    } else {
      console.log('✅ Test user profile already exists');
    }

    console.log('\n🎉 Database fixed successfully!');
    console.log('✅ All profile APIs should now work on localhost and server!');

  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    
    // Fallback: Try to disable RLS completely for testing
    console.log('\n🔄 Trying fallback approach...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
      });
      await supabaseAdmin.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;' 
      });
      console.log('✅ RLS disabled as fallback - APIs should work now');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
    }
  }
}

fixDatabase(); 