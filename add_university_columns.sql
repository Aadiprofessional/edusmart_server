-- SQL to add new columns to universities table for enhanced filtering

-- Add state column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Add type column (public, private, etc.)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Add application_fee column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS application_fee DECIMAL(10,2);

-- Add faculty_count column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS faculty_count INTEGER;

-- Add facilities column (array of strings)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS facilities TEXT[];

-- Add campus_size column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS campus_size VARCHAR(50);

-- Add campus_type column (urban, suburban, rural)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS campus_type VARCHAR(50);

-- Add accreditation column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS accreditation TEXT;

-- Add notable_alumni column (array of strings)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS notable_alumni TEXT[];

-- Add region column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add ranking_type column (QS, TIMES, ARWU, US_NEWS)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS ranking_type VARCHAR(50);

-- Add ranking_year column
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS ranking_year INTEGER;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_universities_state ON universities(state);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);
CREATE INDEX IF NOT EXISTS idx_universities_campus_type ON universities(campus_type);
CREATE INDEX IF NOT EXISTS idx_universities_region ON universities(region);
CREATE INDEX IF NOT EXISTS idx_universities_ranking_type ON universities(ranking_type);
CREATE INDEX IF NOT EXISTS idx_universities_ranking_year ON universities(ranking_year);
CREATE INDEX IF NOT EXISTS idx_universities_student_population ON universities(student_population);
CREATE INDEX IF NOT EXISTS idx_universities_acceptance_rate ON universities(acceptance_rate);

-- Add comments to document the new columns
COMMENT ON COLUMN universities.state IS 'State/Province where the university is located';
COMMENT ON COLUMN universities.type IS 'Type of university (public, private, etc.)';
COMMENT ON COLUMN universities.application_fee IS 'Application fee in USD';
COMMENT ON COLUMN universities.faculty_count IS 'Number of faculty members';
COMMENT ON COLUMN universities.facilities IS 'Array of available facilities';
COMMENT ON COLUMN universities.campus_size IS 'Size of campus (small, medium, large)';
COMMENT ON COLUMN universities.campus_type IS 'Type of campus location (urban, suburban, rural)';
COMMENT ON COLUMN universities.accreditation IS 'Accreditation information';
COMMENT ON COLUMN universities.notable_alumni IS 'Array of notable alumni names';
COMMENT ON COLUMN universities.region IS 'Geographic region';
COMMENT ON COLUMN universities.ranking_type IS 'Type of ranking (QS, TIMES, ARWU, US_NEWS)';
COMMENT ON COLUMN universities.ranking_year IS 'Year of the ranking data'; 