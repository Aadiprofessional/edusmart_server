-- Re-enable RLS with proper policies for service role
-- Run this in Supabase SQL Editor

-- Re-enable RLS on blogs table
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on scholarships table  
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;
DROP POLICY IF EXISTS "Anyone can view scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;

-- Create new policies for blogs
-- Allow public read access
CREATE POLICY "Public can view blogs" ON public.blogs
    FOR SELECT USING (true);

-- Allow service role full access (bypasses RLS)
CREATE POLICY "Service role can manage blogs" ON public.blogs
    FOR ALL USING (true) WITH CHECK (true);

-- Create new policies for scholarships  
-- Allow public read access
CREATE POLICY "Public can view scholarships" ON public.scholarships
    FOR SELECT USING (true);

-- Allow service role full access (bypasses RLS)
CREATE POLICY "Service role can manage scholarships" ON public.scholarships
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions to service role
GRANT ALL ON public.blogs TO service_role;
GRANT ALL ON public.scholarships TO service_role;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('blogs', 'scholarships');

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('blogs', 'scholarships'); 