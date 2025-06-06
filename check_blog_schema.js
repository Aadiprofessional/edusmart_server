const { supabaseAdmin } = require('./src/utils/supabase');

async function checkBlogSchema() {
  console.log('🔍 Checking Blog Table Schema...\n');

  try {
    // Check blogs table structure
    console.log('1. Checking blogs table structure...');
    const { data: blogs, error: blogsError } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .limit(1);
    
    if (blogsError) {
      console.log('❌ Error fetching blogs:', blogsError);
      return;
    }
    
    if (blogs && blogs.length > 0) {
      console.log('✅ Blog table columns:', Object.keys(blogs[0]));
      console.log('Sample blog data:', blogs[0]);
    }

    // Check profiles table structure
    console.log('\n2. Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Profiles table columns:', Object.keys(profiles[0]));
      console.log('Sample profile data:', profiles[0]);
    }

    // Try different join approaches
    console.log('\n3. Testing different join approaches...');
    
    // Approach 1: Manual join using author_id
    console.log('Testing manual join with author_id...');
    const { data: manualJoin, error: manualError } = await supabaseAdmin
      .from('blogs')
      .select(`
        *,
        profiles!blogs_author_id_fkey(name, avatar_url)
      `)
      .limit(1);
    
    if (manualError) {
      console.log('❌ Manual join error:', manualError);
    } else {
      console.log('✅ Manual join successful:', manualJoin?.[0]);
    }

    // Approach 2: Try without explicit foreign key name
    console.log('\nTesting simple join...');
    const { data: simpleJoin, error: simpleError } = await supabaseAdmin
      .from('blogs')
      .select(`
        *,
        profiles(name, avatar_url)
      `)
      .eq('author_id', profiles?.[0]?.id)
      .limit(1);
    
    if (simpleError) {
      console.log('❌ Simple join error:', simpleError);
    } else {
      console.log('✅ Simple join successful:', simpleJoin?.[0]);
    }

    // Approach 3: Separate queries
    console.log('\nTesting separate queries approach...');
    const { data: blogsOnly, error: blogsOnlyError } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .limit(2);
    
    if (blogsOnlyError) {
      console.log('❌ Blogs only error:', blogsOnlyError);
    } else {
      console.log('✅ Blogs only successful, count:', blogsOnly?.length);
      
      if (blogsOnly && blogsOnly.length > 0) {
        // Get author info separately
        const authorIds = blogsOnly.map(blog => blog.author_id);
        const { data: authors, error: authorsError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', authorIds);
        
        if (authorsError) {
          console.log('❌ Authors query error:', authorsError);
        } else {
          console.log('✅ Authors query successful:', authors);
          
          // Manually combine the data
          const blogsWithAuthors = blogsOnly.map(blog => ({
            ...blog,
            author: authors?.find(author => author.id === blog.author_id)
          }));
          
          console.log('✅ Manual combination successful:', blogsWithAuthors[0]);
        }
      }
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
}

checkBlogSchema(); 