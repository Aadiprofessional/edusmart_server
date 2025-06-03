const { supabaseAdmin } = require('./src/utils/supabase');

const getAdminUid = async () => {
  try {
    console.log('🔍 Getting admin UID for matrixai.global@gmail.com...');
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, name')
      .eq('email', 'matrixai.global@gmail.com')
      .single();
    
    if (error) {
      console.error('❌ Error fetching admin user:', error);
      return;
    }
    
    if (!data) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Role:', data.role);
    console.log('UID:', data.id);
    console.log('\n📋 Copy this UID and use it in your test scripts:');
    console.log(`const ADMIN_UID = '${data.id}';`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

getAdminUid();