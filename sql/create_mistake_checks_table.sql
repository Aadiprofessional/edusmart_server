-- Create mistake_checks table for storing mistake check submissions and results
-- This table stores all data from the CheckMistakesComponent including files, summaries, extracted text, and mistakes

CREATE TABLE IF NOT EXISTS mistake_checks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- File information
  file_name TEXT,
  file_url TEXT,
  file_type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text', 'image', 'pdf', etc.
  file_path TEXT, -- internal storage path
  
  -- Input and processed data
  text TEXT, -- user's input text for checking (renamed from input_text)
  extracted_texts JSONB, -- extracted text from uploaded files (array for multi-page)
  document_pages JSONB, -- document page information
  
  -- AI results
  mistakes JSONB, -- array of mistakes found with details
  page_mistakes JSONB, -- mistakes per page for PDFs
  page_markings JSONB, -- page markings and annotations
  marking_summary JSONB, -- summary of markings and feedback
  
  -- Processing configuration and status
  selected_marking_standard VARCHAR(20) DEFAULT 'hkdse', -- marking standard used
  current_page INTEGER DEFAULT 0,
  overall_processing_complete BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_mistake_checks_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mistake_checks_user_id ON mistake_checks (user_id);
CREATE INDEX IF NOT EXISTS idx_mistake_checks_created_at ON mistake_checks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mistake_checks_file_type ON mistake_checks (file_type);
CREATE INDEX IF NOT EXISTS idx_mistake_checks_processing ON mistake_checks (overall_processing_complete);
CREATE INDEX IF NOT EXISTS idx_mistake_checks_marking_standard ON mistake_checks (selected_marking_standard);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mistake_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mistake_checks_updated_at
  BEFORE UPDATE ON mistake_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_mistake_checks_updated_at();

-- Add RLS policies
ALTER TABLE mistake_checks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own mistake checks
CREATE POLICY "Users can access their own mistake checks" ON mistake_checks
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role full access" ON mistake_checks
  FOR ALL TO service_role
  USING (true);

-- Grant permissions
GRANT ALL ON mistake_checks TO authenticated;
GRANT ALL ON mistake_checks TO service_role;
GRANT USAGE ON SEQUENCE mistake_checks_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE mistake_checks_id_seq TO service_role; 