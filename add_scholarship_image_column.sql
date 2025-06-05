-- SQL to add image column to scholarships table

-- Add image column to scholarships table
ALTER TABLE scholarships 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN scholarships.image IS 'URL of the scholarship image/logo'; 