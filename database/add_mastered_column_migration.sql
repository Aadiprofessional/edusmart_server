-- Migration to add mastered column to flashcards table if it doesn't exist
-- This is safe to run multiple times

DO $$ 
BEGIN
    -- Check if the mastered column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'flashcards' 
        AND column_name = 'mastered'
    ) THEN
        ALTER TABLE flashcards ADD COLUMN mastered BOOLEAN DEFAULT FALSE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_flashcards_mastered ON flashcards(mastered);
        
        RAISE NOTICE 'Added mastered column to flashcards table';
    ELSE
        RAISE NOTICE 'Mastered column already exists in flashcards table';
    END IF;
END $$; 