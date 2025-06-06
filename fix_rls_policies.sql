-- =============================================
-- FIX RLS POLICIES FOR USER PROFILES
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own user_profile" ON public.user_profiles;

-- 2. Create more permissive policies for user_profiles
-- Allow authenticated users to insert their own user profile
CREATE POLICY "Allow authenticated users to insert user_profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own user profile
CREATE POLICY "Allow users to view own user_profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own user profile
CREATE POLICY "Allow users to update own user_profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own user profile
CREATE POLICY "Allow users to delete own user_profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Also fix profiles table policies if needed
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- Allow service role to manage profiles (for automatic profile creation)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Alternative: Temporarily disable RLS for testing (ONLY FOR DEBUGGING)
-- Uncomment these lines if you want to temporarily disable RLS for testing
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 5. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles')
ORDER BY tablename, policyname; 