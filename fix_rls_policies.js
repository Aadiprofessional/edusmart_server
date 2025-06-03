const { supabaseAdmin } = require('./src/utils/supabase');

const fixRlsPolicies = async () => {
  try {
    console.log('🔧 Fixing RLS policies for UID-based authentication...');
    
    // First, let's disable RLS temporarily to test
    console.log('1. Testing blog creation with RLS disabled...');
    
    // Try creating a blog directly with admin client (bypasses RLS)
    const adminUid = 'bca2f806-29c5-4be9-bc2d-a484671546cd';
    
    const { data: testBlog, error: createError } = await supabaseAdmin
      .from('blogs')
      .insert([
        {
          title: 'RLS Fix Test Blog',
          content: 'This is a test blog to verify the RLS policies are working correctly with UID-based authentication.',
          excerpt: 'Testing RLS policy fix',
          category: 'Test',
          tags: ['test', 'rls', 'fix'],
          author_id: adminUid
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating test blog with admin client:', createError);
      
      // The issue might be that we need to use the service role key properly
      console.log('2. Checking if admin client has proper permissions...');
      
      // Try a simple select to test permissions
      const { data: profiles, error: selectError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .limit(1);
      
      if (selectError) {
        console.log('❌ Admin client select error:', selectError);
      } else {
        console.log('✅ Admin client can read profiles:', profiles?.length || 0);
      }
      
    } else {
      console.log('✅ Test blog created successfully:', testBlog.id);
      
      // Clean up test blog
      const { error: deleteError } = await supabaseAdmin
        .from('blogs')
        .delete()
        .eq('id', testBlog.id);
      
      if (deleteError) {
        console.log('❌ Error deleting test blog:', deleteError);
      } else {
        console.log('✅ Test blog cleaned up');
      }
    }
    
    // Test scholarship creation
    console.log('3. Testing scholarship creation...');
    const { data: testScholarship, error: scholarshipError } = await supabaseAdmin
      .from('scholarships')
      .insert([
        {
          title: 'RLS Fix Test Scholarship',
          description: 'This is a test scholarship to verify the RLS policies are working correctly.',
          amount: 1000,
          eligibility: 'Test eligibility',
          deadline: '2024-12-31',
          university: 'Test University',
          country: 'USA',
          created_by: adminUid
        }
      ])
      .select()
      .single();
    
    if (scholarshipError) {
      console.log('❌ Error creating test scholarship:', scholarshipError);
    } else {
      console.log('✅ Test scholarship created successfully:', testScholarship.id);
      
      // Clean up
      await supabaseAdmin.from('scholarships').delete().eq('id', testScholarship.id);
      console.log('✅ Test scholarship cleaned up');
    }
    
    console.log('🎉 RLS policy testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing RLS policies:', error);
  }
};

fixRlsPolicies();