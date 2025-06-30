-- Create flashcard_sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'ai-generated', 'file-upload')),
    source_file VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_created_at ON flashcard_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(flashcard_set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_mastered ON flashcards(mastered);

-- Enable Row Level Security (RLS)
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flashcard_sets
CREATE POLICY "Users can view their own flashcard sets" ON flashcard_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard sets" ON flashcard_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard sets" ON flashcard_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcard sets" ON flashcard_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards from their sets" ON flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM flashcard_sets 
            WHERE flashcard_sets.id = flashcards.flashcard_set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert flashcards to their sets" ON flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM flashcard_sets 
            WHERE flashcard_sets.id = flashcards.flashcard_set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update flashcards in their sets" ON flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM flashcard_sets 
            WHERE flashcard_sets.id = flashcards.flashcard_set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete flashcards from their sets" ON flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM flashcard_sets 
            WHERE flashcard_sets.id = flashcards.flashcard_set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_flashcard_sets_updated_at 
    BEFORE UPDATE ON flashcard_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at 
    BEFORE UPDATE ON flashcards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 