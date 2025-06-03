-- Fix RLS policies for blogs table to allow public read access

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;

-- Create new policies
-- Allow anyone (including anonymous users) to view blogs
CREATE POLICY "Public can view blogs" ON public.blogs
    FOR SELECT USING (true);

-- Allow only admins to insert, update, delete blogs
CREATE POLICY "Admins can manage blogs" ON public.blogs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'blogs'; 