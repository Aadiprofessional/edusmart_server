-- =============================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Run this in your Supabase SQL Editor
-- WARNING: This removes security, only for testing!
-- =============================================

-- 1. Disable RLS on user_profiles table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on profiles table (if needed)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 4. Ensure foreign key is correct
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'RLS disabled for testing - REMEMBER TO RE-ENABLE FOR PRODUCTION!' as warning; 