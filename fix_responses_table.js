const { supabaseAdmin } = require('./src/utils/supabase');

async function fixResponsesTable() {
  try {
    console.log('Dropping existing responses table...');
    
    // Drop the existing table
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'DROP TABLE IF EXISTS responses CASCADE;'
    });
    
    if (dropError) {
      console.error('Error dropping table:', dropError);
      return;
    }
    
    console.log('Creating new responses table...');
    
    // Create the table with correct schema
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('ebook', 'guide', 'template', 'checklist', 'video', 'webinar', 'course')),
          category VARCHAR(50) NOT NULL CHECK (category IN ('application', 'test-prep', 'career', 'study', 'visa', 'finance')),
          url TEXT NOT NULL,
          file_size BIGINT,
          thumbnail TEXT,
          download_link TEXT,
          video_link TEXT,
          featured BOOLEAN DEFAULT FALSE,
          tags TEXT[] DEFAULT '{}',
          downloads INTEGER DEFAULT 0,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }
    
    console.log('Creating indexes...');
    
    // Create indexes
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_responses_type ON responses(type);
        CREATE INDEX IF NOT EXISTS idx_responses_category ON responses(category);
        CREATE INDEX IF NOT EXISTS idx_responses_featured ON responses(featured);
        CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
        CREATE INDEX IF NOT EXISTS idx_responses_downloads ON responses(downloads);
      `
    });
    
    if (indexError) {
      console.error('Error creating indexes:', indexError);
    }
    
    console.log('Setting up RLS policies...');
    
    // Enable RLS and create policies
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow public read access" ON responses
          FOR SELECT USING (true);
        
        CREATE POLICY "Allow admin full access" ON responses
          FOR ALL USING (true);
      `
    });
    
    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    }
    
    console.log('Adding sample data...');
    
    // Add sample resources
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('responses')
      .insert([
        {
          title: 'Ultimate Graduate School Application Guide',
          description: 'A comprehensive guide covering every aspect of the graduate school application process, from selecting programs to acing interviews.',
          type: 'guide',
          category: 'application',
          url: '/resources/guides/graduate-application-guide.pdf',
          thumbnail: 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80',
          download_link: '/resources/guides/graduate-application-guide.pdf',
          featured: true,
          tags: ['SOP', 'CV', 'Recommendations', 'Interview'],
          created_by: 'bca2f806-29c5-4be9-bc2d-a484671546cd'
        },
        {
          title: 'GRE Preparation Masterclass',
          description: 'A comprehensive video course covering all GRE sections with proven strategies to maximize your score.',
          type: 'video',
          category: 'test-prep',
          url: 'https://www.youtube.com/watch?v=example',
          thumbnail: 'https://images.unsplash.com/photo-1606326608690-4e0281b1e588?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80',
          featured: false,
          tags: ['GRE', 'Test Prep', 'Strategies'],
          created_by: 'bca2f806-29c5-4be9-bc2d-a484671546cd'
        },
        {
          title: 'Statement of Purpose Templates & Examples',
          description: 'A collection of successful SOP templates and examples for various programs, with annotations explaining effective strategies.',
          type: 'template',
          category: 'application',
          url: '/resources/templates/sop-templates.zip',
          thumbnail: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80',
          download_link: '/resources/templates/sop-templates.zip',
          featured: false,
          tags: ['SOP', 'Writing', 'Examples'],
          created_by: 'bca2f806-29c5-4be9-bc2d-a484671546cd'
        }
      ])
      .select();
    
    if (sampleError) {
      console.error('Error adding sample data:', sampleError);
    } else {
      console.log('Sample data added successfully:', sampleData);
    }
    
    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('responses')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('Table test successful. Found', testData?.length || 0, 'records.');
      console.log('Sample record:', testData?.[0]?.title);
    }
    
    console.log('Responses table setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up responses table:', error);
  }
}

fixResponsesTable(); 