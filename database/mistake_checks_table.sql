-- Create mistake_checks table
CREATE TABLE IF NOT EXISTS public.mistake_checks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    file_name text,
    file_url text,
    file_path text,
    file_type text DEFAULT 'text',
    text text DEFAULT '',
    document_pages jsonb,
    mistakes jsonb DEFAULT '[]'::jsonb,
    page_mistakes jsonb,
    extracted_texts jsonb,
    page_markings jsonb,
    marking_summary jsonb,
    selected_marking_standard text DEFAULT 'hkdse',
    current_page integer DEFAULT 0,
    overall_processing_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_mistake_checks_user_id ON public.mistake_checks(user_id);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_mistake_checks_created_at ON public.mistake_checks(created_at DESC);

-- Add RLS (Row Level Security) policy
ALTER TABLE public.mistake_checks ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own records
CREATE POLICY "Users can only see their own mistake checks" ON public.mistake_checks
    FOR ALL USING (auth.uid()::text = user_id);

-- Policy for service role (for admin access)
CREATE POLICY "Service role can access all mistake checks" ON public.mistake_checks
    FOR ALL USING (auth.role() = 'service_role');
