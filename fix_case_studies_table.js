const { supabaseAdmin } = require('./src/utils/supabase');

async function fixCaseStudiesTable() {
  try {
    console.log('Dropping existing case_studies table...');
    
    // Drop the existing table
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'DROP TABLE IF EXISTS case_studies CASCADE;'
    });
    
    if (dropError) {
      console.error('Error dropping table:', dropError);
      return;
    }
    
    console.log('Creating new case_studies table...');
    
    // Create the table with correct schema
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE case_studies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(200) NOT NULL,
          subtitle VARCHAR(300),
          description TEXT NOT NULL,
          student_name VARCHAR(100) NOT NULL,
          student_image TEXT,
          student_background TEXT,
          previous_education TEXT,
          target_program VARCHAR(200),
          target_university VARCHAR(200),
          target_country VARCHAR(100),
          outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('accepted', 'scholarship', 'rejected', 'waitlisted', 'in-progress')),
          scholarship_amount DECIMAL(12,2),
          scholarship_currency VARCHAR(10) DEFAULT 'USD',
          application_year INTEGER,
          story_content TEXT NOT NULL,
          challenges_faced TEXT[],
          strategies_used TEXT[],
          advice_given TEXT[],
          timeline JSONB,
          test_scores JSONB,
          documents_used TEXT[],
          featured BOOLEAN DEFAULT FALSE,
          category VARCHAR(50) NOT NULL CHECK (category IN ('undergraduate', 'graduate', 'phd', 'scholarship', 'visa', 'career-change')),
          field_of_study VARCHAR(100),
          tags TEXT[] DEFAULT '{}',
          reading_time INTEGER,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
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
        CREATE INDEX IF NOT EXISTS idx_case_studies_category ON case_studies(category);
        CREATE INDEX IF NOT EXISTS idx_case_studies_outcome ON case_studies(outcome);
        CREATE INDEX IF NOT EXISTS idx_case_studies_featured ON case_studies(featured);
        CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
        CREATE INDEX IF NOT EXISTS idx_case_studies_created_at ON case_studies(created_at);
      `
    });
    
    if (indexError) {
      console.error('Error creating indexes:', indexError);
    }
    
    console.log('Setting up RLS policies...');
    
    // Enable RLS and create policies
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow public read access" ON case_studies
          FOR SELECT USING (status = 'published');
        
        CREATE POLICY "Allow admin full access" ON case_studies
          FOR ALL USING (true);
      `
    });
    
    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    }
    
    console.log('Adding sample data...');
    
    // Add sample case study
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('case_studies')
      .insert([{
        title: 'From Engineering to MIT: A Data Science Journey',
        subtitle: 'How I transitioned from mechanical engineering to land a spot at MIT for my Master\'s in Data Science',
        description: 'A comprehensive case study of transitioning from mechanical engineering to data science and successfully getting admitted to MIT with a partial scholarship.',
        student_name: 'Priya Sharma',
        student_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80',
        student_background: 'Mechanical Engineer with 3 years of industry experience in automotive sector',
        previous_education: 'B.Tech in Mechanical Engineering from IIT Delhi (GPA: 8.7/10)',
        target_program: 'Master of Science in Data Science',
        target_university: 'Massachusetts Institute of Technology (MIT)',
        target_country: 'United States',
        outcome: 'scholarship',
        scholarship_amount: 25000.00,
        application_year: 2023,
        story_content: 'My journey from mechanical engineering to data science wasn\'t straightforward, but it was incredibly rewarding. After working for three years in the automotive industry, I realized my passion lay in analyzing data patterns and building predictive models. The transition required significant preparation, including self-learning programming languages, taking online courses, and building a portfolio of data science projects.',
        challenges_faced: ['Career transition from different field', 'Limited formal data science education', 'Competitive admission process', 'Financial constraints'],
        strategies_used: ['Self-taught programming (Python, R)', 'Completed online certifications', 'Built portfolio projects', 'Networked with professionals', 'Prepared extensively for GRE'],
        advice_given: ['Start preparing at least 18 months in advance', 'Build a strong portfolio with real projects', 'Network with current students and alumni', 'Tailor your SOP to each program', 'Don\'t underestimate the importance of test scores'],
        timeline: {
          "milestones": [
            {"date": "2022-01", "event": "Started GRE preparation"},
            {"date": "2022-04", "event": "Took GRE (Score: 325)"},
            {"date": "2022-06", "event": "Completed online data science courses"},
            {"date": "2022-09", "event": "Started building portfolio projects"},
            {"date": "2022-12", "event": "Submitted applications"},
            {"date": "2023-03", "event": "Received admission offer"},
            {"date": "2023-04", "event": "Scholarship notification"}
          ]
        },
        test_scores: {
          "GRE": {"verbal": 160, "quantitative": 165, "writing": 4.5},
          "TOEFL": {"total": 108, "reading": 28, "listening": 27, "speaking": 26, "writing": 27}
        },
        featured: true,
        category: 'graduate',
        field_of_study: 'Data Science',
        tags: ['MIT', 'Data Science', 'Career Change', 'Scholarship', 'Engineering'],
        reading_time: 8,
        created_by: 'bca2f806-29c5-4be9-bc2d-a484671546cd'
      }])
      .select();
    
    if (sampleError) {
      console.error('Error adding sample data:', sampleError);
    } else {
      console.log('Sample data added successfully:', sampleData);
    }
    
    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('case_studies')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('Table test successful. Found', testData?.length || 0, 'records.');
      console.log('Sample record:', testData?.[0]?.title);
    }
    
    console.log('Case studies table setup completed successfully!');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixCaseStudiesTable(); 