const { supabaseAdmin } = require('./src/utils/supabase');

async function debugBlogAPI() {
  console.log('🔍 Debugging Blog API...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Test 2: Check if blogs table exists and has data
    console.log('\n2. Testing blogs table...');
    const { data: blogs, error: blogsError, count } = await supabaseAdmin
      .from('blogs')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (blogsError) {
      console.log('❌ Error fetching blogs:', blogsError);
      return;
    }
    
    console.log(`✅ Blogs table accessible. Found ${count} blogs`);
    if (blogs && blogs.length > 0) {
      console.log('Sample blog:', {
        id: blogs[0].id,
        title: blogs[0].title,
        author_id: blogs[0].author_id
      });
    }

    // Test 3: Test the join with profiles table
    console.log('\n3. Testing blogs with author join...');
    const { data: blogsWithAuthor, error: joinError } = await supabaseAdmin
      .from('blogs')
      .select('*, author:profiles(name, avatar_url)')
      .limit(2);
    
    if (joinError) {
      console.log('❌ Error with author join:', joinError);
      return;
    }
    
    console.log('✅ Author join successful');
    if (blogsWithAuthor && blogsWithAuthor.length > 0) {
      console.log('Sample blog with author:', {
        title: blogsWithAuthor[0].title,
        author: blogsWithAuthor[0].author
      });
    }

    // Test 4: Test the exact query from the controller
    console.log('\n4. Testing exact controller query...');
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    let query = supabaseAdmin
      .from('blogs')
      .select('*, author:profiles(name, avatar_url)', { count: 'exact' });
    
    const { data: controllerBlogs, error: controllerError, count: controllerCount } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (controllerError) {
      console.log('❌ Controller query error:', controllerError);
      return;
    }
    
    console.log(`✅ Controller query successful. Found ${controllerCount} blogs`);
    console.log('Response structure:', {
      blogsCount: controllerBlogs?.length || 0,
      totalCount: controllerCount,
      firstBlog: controllerBlogs?.[0] ? {
        id: controllerBlogs[0].id,
        title: controllerBlogs[0].title,
        author: controllerBlogs[0].author
      } : null
    });

  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
}

debugBlogAPI(); 