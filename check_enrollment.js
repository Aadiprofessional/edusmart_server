const { supabaseAdmin } = require('./src/utils/supabase');

async function checkEnrollment() {
  console.log('Checking enrollment for user b846c59e-7422-4be3-a4f6-dd20145e8400 in course e9980480-7166-40a2-a18d-7f2d5124a445');
  
  const { data, error } = await supabaseAdmin
    .from('course_enrollments')
    .select('*')
    .eq('user_id', 'b846c59e-7422-4be3-a4f6-dd20145e8400')
    .eq('course_id', 'e9980480-7166-40a2-a18d-7f2d5124a445');
  
  console.log('Enrollment check:', { data, error });
  
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', 'b846c59e-7422-4be3-a4f6-dd20145e8400')
    .single();
  
  console.log('Profile check:', { profile, profileError });
  
  // Check all enrollments for this user
  const { data: allEnrollments, error: allError } = await supabaseAdmin
    .from('course_enrollments')
    .select('*')
    .eq('user_id', 'b846c59e-7422-4be3-a4f6-dd20145e8400');
  
  console.log('All enrollments for user:', { allEnrollments, allError });
}

checkEnrollment().catch(console.error); 