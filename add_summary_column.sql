-- SQL to add summary column to course_lectures table
-- This column will store AI-generated summaries of video lecture content

ALTER TABLE course_lectures 
ADD COLUMN summary TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN course_lectures.summary IS 'AI-generated summary of video lecture content for educational purposes';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_lectures' 
AND column_name = 'summary'; 