const { supabaseAdmin } = require('./src/utils/supabase');

async function createCaseStudiesTable() {
  try {
    console.log('Creating case_studies table...');
    
    // Create the table with a simple structure first
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS case_studies (
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
    
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    
    console.log('Table creation result:', data);
    
    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('case_studies')
      .select('count(*)')
      .single();
      
    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('Table test successful:', testData);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

createCaseStudiesTable(); 