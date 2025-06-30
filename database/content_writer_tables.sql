-- Create content_writer table
CREATE TABLE IF NOT EXISTS content_writer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'essay',
    content_type VARCHAR(50) DEFAULT 'essay',
    word_count INTEGER DEFAULT 500,
    tone VARCHAR(50) DEFAULT 'academic',
    font_size INTEGER DEFAULT 16,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_writer_user_id ON content_writer(user_id);
CREATE INDEX IF NOT EXISTS idx_content_writer_created_at ON content_writer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_writer_template_type ON content_writer(template_type);
CREATE INDEX IF NOT EXISTS idx_content_writer_content_type ON content_writer(content_type);

-- Enable Row Level Security (RLS)
ALTER TABLE content_writer ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_writer
CREATE POLICY "Users can view their own content" ON content_writer
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON content_writer
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON content_writer
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON content_writer
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_writer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_content_writer_updated_at 
    BEFORE UPDATE ON content_writer 
    FOR EACH ROW EXECUTE FUNCTION update_content_writer_updated_at(); 