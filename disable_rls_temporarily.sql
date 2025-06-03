-- Temporarily disable RLS for testing admin operations
-- Run this in Supabase SQL Editor

-- Disable RLS on blogs table
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on scholarships table  
ALTER TABLE public.scholarships DISABLE ROW LEVEL SECURITY;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('blogs', 'scholarships');

-- Note: Remember to re-enable RLS after testing:
-- ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY; 