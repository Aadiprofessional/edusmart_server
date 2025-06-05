const { supabaseAdmin } = require('./src/utils/supabase');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  try {
    console.log('Starting database migrations...');

    // Read and execute university columns migration
    const universityMigrationPath = path.join(__dirname, 'add_university_columns.sql');
    const universityMigrationSQL = fs.readFileSync(universityMigrationPath, 'utf8');
    
    console.log('Executing university columns migration...');
    const { data: universityResult, error: universityError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: universityMigrationSQL
    });

    if (universityError) {
      console.error('University migration error:', universityError);
    } else {
      console.log('University migration completed successfully');
    }

    // Read and execute scholarship image migration
    const scholarshipMigrationPath = path.join(__dirname, 'add_scholarship_image_column.sql');
    const scholarshipMigrationSQL = fs.readFileSync(scholarshipMigrationPath, 'utf8');
    
    console.log('Executing scholarship image migration...');
    const { data: scholarshipResult, error: scholarshipError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: scholarshipMigrationSQL
    });

    if (scholarshipError) {
      console.error('Scholarship migration error:', scholarshipError);
    } else {
      console.log('Scholarship migration completed successfully');
    }

    console.log('All migrations completed!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Execute SQL statements individually
async function executeMigrationAlternative() {
  try {
    console.log('Starting database migrations (alternative approach)...');

    // University table alterations
    const universityAlterations = [
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS state VARCHAR(100);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_fee DECIMAL(10,2);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS faculty_count INTEGER;",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS facilities TEXT[];",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS campus_size VARCHAR(50);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS campus_type VARCHAR(50);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS accreditation TEXT;",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS notable_alumni TEXT[];",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS region VARCHAR(100);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS ranking_type VARCHAR(50);",
      "ALTER TABLE universities ADD COLUMN IF NOT EXISTS ranking_year INTEGER;"
    ];

    for (const sql of universityAlterations) {
      console.log(`Executing: ${sql}`);
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error(`Error executing ${sql}:`, error);
      } else {
        console.log('✓ Success');
      }
    }

    // Scholarship table alteration
    console.log('Adding image column to scholarships table...');
    const { error: scholarshipError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS image TEXT;"
    });

    if (scholarshipError) {
      console.error('Scholarship migration error:', scholarshipError);
    } else {
      console.log('✓ Scholarship image column added successfully');
    }

    console.log('All migrations completed!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Try the RPC approach first, fallback to alternative if needed
executeMigration().catch(() => {
  console.log('RPC approach failed, trying alternative approach...');
  executeMigrationAlternative();
}); 