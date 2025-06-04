const { supabaseAdmin } = require('./src/utils/supabase');

async function checkCaseStudiesSchema() {
  try {
    console.log('Checking case_studies table schema...');
    
    // Try to get table info
    const { data, error } = await supabaseAdmin
      .from('case_studies')
      .select('*')
      .limit(0);
      
    if (error) {
      console.error('Error accessing table:', error);
      
      // Try to get basic info about the table
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'case_studies')
        .eq('table_schema', 'public');
        
      if (tableError) {
        console.error('Error getting table schema:', tableError);
      } else {
        console.log('Table columns:', tableData);
      }
    } else {
      console.log('Table exists and is accessible');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkCaseStudiesSchema(); 