const { supabaseAdmin } = require('./src/utils/supabase');

async function checkAndSetupProfiles() {
  try {
    console.log('Checking current profiles...');
    
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`- ID: ${profile.id}, Name: ${profile.name}, Role: ${profile.role}`);
    });
    
    // Check if admin user exists
    const adminId = 'bca2f806-29c5-4be9-bc2d-a484671546cd';
    const adminExists = profiles.find(p => p.id === adminId);
    
    if (!adminExists) {
      console.log('\nCreating test admin user...');
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: adminId,
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'admin',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating admin:', createError);
      } else {
        console.log('✅ Test admin created successfully:', newAdmin);
      }
    } else {
      console.log('✅ Admin user already exists');
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkAndSetupProfiles(); 