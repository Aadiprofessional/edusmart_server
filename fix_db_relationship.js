const { supabaseAdmin } = require('./src/utils/supabase');

const fixDatabaseRelationship = async () => {
  try {
    console.log('🔧 Fixing database relationship issues...');
    
    // Check if there are any blogs with invalid author_ids
    console.log('1. Checking for blogs with invalid author_ids...');
    const { data: invalidBlogs, error: checkError } = await supabaseAdmin
      .from('blogs')
      .select('id, author_id')
      .not('author_id', 'in', `(SELECT id FROM profiles)`);
    
    if (checkError) {
      console.log('Error checking invalid blogs:', checkError);
    } else {
      console.log(`Found ${invalidBlogs?.length || 0} blogs with invalid author_ids`);
      
      // Delete invalid blogs if any
      if (invalidBlogs && invalidBlogs.length > 0) {
        console.log('2. Deleting blogs with invalid author_ids...');
        for (const blog of invalidBlogs) {
          const { error: deleteError } = await supabaseAdmin
            .from('blogs')
            .delete()
            .eq('id', blog.id);
          
          if (deleteError) {
            console.log(`Error deleting blog ${blog.id}:`, deleteError);
          } else {
            console.log(`✅ Deleted blog ${blog.id}`);
          }
        }
      }
    }
    
    // Test creating a blog with the admin UID
    console.log('3. Testing blog creation with admin UID...');
    const adminUid = 'bca2f806-29c5-4be9-bc2d-a484671546cd';
    
    const { data: testBlog, error: createError } = await supabaseAdmin
      .from('blogs')
      .insert([
        {
          title: 'Database Fix Test Blog',
          content: 'This is a test blog to verify the database relationship is working correctly after the fix.',
          excerpt: 'Testing database relationship fix',
          category: 'Test',
          tags: ['test', 'database', 'fix'],
          author_id: adminUid
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating test blog:', createError);
    } else {
      console.log('✅ Test blog created successfully:', testBlog.id);
      
      // Clean up test blog
      await supabaseAdmin.from('blogs').delete().eq('id', testBlog.id);
      console.log('✅ Test blog cleaned up');
    }
    
    console.log('🎉 Database relationship fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  }
};

fixDatabaseRelationship(); 