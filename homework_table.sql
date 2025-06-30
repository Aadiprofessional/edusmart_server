-- Create homework_submissions table for storing homework data
CREATE TABLE homework_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name TEXT,
    file_url TEXT,
    file_path TEXT,
    file_type TEXT,
    question TEXT DEFAULT '',
    solution TEXT DEFAULT '',
    page_solutions JSONB,
    current_page INTEGER DEFAULT 0,
    processing_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX idx_homework_submissions_user_id ON homework_submissions(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_homework_submissions_created_at ON homework_submissions(created_at DESC);

-- Create index on user_id and created_at combined for efficient history queries
CREATE INDEX idx_homework_submissions_user_created ON homework_submissions(user_id, created_at DESC);

-- Create storage bucket for homework files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-files', 'homework-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own homework submissions
CREATE POLICY "Users can access their own homework" ON homework_submissions
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Allow service role to access all homework submissions (for admin operations)
CREATE POLICY "Service role can access all homework" ON homework_submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT ALL ON homework_submissions TO authenticated;
GRANT ALL ON homework_submissions TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE homework_submissions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE homework_submissions_id_seq TO service_role;

-- Create or update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_homework_submissions_updated_at 
    BEFORE UPDATE ON homework_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE homework_submissions IS 'Stores homework submissions with files, questions, solutions, and processing status';
COMMENT ON COLUMN homework_submissions.user_id IS 'UUID of the user who submitted the homework';
COMMENT ON COLUMN homework_submissions.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN homework_submissions.file_url IS 'Public URL of the uploaded file in storage';
COMMENT ON COLUMN homework_submissions.file_path IS 'Storage path of the uploaded file';
COMMENT ON COLUMN homework_submissions.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN homework_submissions.question IS 'Text question if no file uploaded or extracted text';
COMMENT ON COLUMN homework_submissions.solution IS 'AI-generated solution to the homework';
COMMENT ON COLUMN homework_submissions.page_solutions IS 'JSON array of page-specific solutions for multi-page documents';
COMMENT ON COLUMN homework_submissions.current_page IS 'Current page number for multi-page documents';
COMMENT ON COLUMN homework_submissions.processing_complete IS 'Whether the AI processing is complete'; 