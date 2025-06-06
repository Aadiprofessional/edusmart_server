const { supabaseAdmin } = require('./src/utils/supabase');
const fs = require('fs');

async function runSQL() {
  try {
    console.log('Running enhanced course system SQL...');
    const sql = fs.readFileSync('./enhanced_course_system.sql', 'utf8');
    
    // For Supabase, we need to run the SQL directly in the SQL editor
    // This script will help identify any issues
    console.log('SQL file loaded successfully');
    console.log('Please run the enhanced_course_system.sql file in your Supabase SQL Editor');
    console.log('The file contains all necessary tables, indexes, triggers, and policies');
    
    // Test connection
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connection successful');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runSQL(); 