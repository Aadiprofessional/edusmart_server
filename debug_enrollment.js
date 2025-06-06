const { supabaseAdmin } = require('./src/utils/supabase');

async function checkEnrollment() {
  const uid = 'b846c59e-7422-4be3-a4f6-dd20145e8400';
  const courseId = 'e9980480-7166-40a2-a18d-7f2d5124a445';
  
  console.log('Checking enrollment for:', { uid, courseId });
  
  // Check profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();
  
  console.log('Profile check:', { profile, profileError });
  
  // Check enrollment
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('course_enrollments')
    .select('*')
    .eq('user_id', uid)
    .eq('course_id', courseId);
  
  console.log('All enrollments:', { enrollment, enrollmentError });
  
  // Check active enrollment
  const { data: activeEnrollment, error: activeError } = await supabaseAdmin
    .from('course_enrollments')
    .select('*')
    .eq('user_id', uid)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .single();
  
  console.log('Active enrollment:', { activeEnrollment, activeError });
  
  // Test the exact query from the controller
  const { data: controllerQuery, error: controllerError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('user_id', uid)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .single();
  
  console.log('Controller query result:', { controllerQuery, controllerError });
}

checkEnrollment().catch(console.error); 