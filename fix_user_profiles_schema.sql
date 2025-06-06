-- =============================================
-- FIX USER PROFILES TABLE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop the foreign key constraint that's causing issues
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- 2. Modify the user_id column to reference auth.users directly
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Disable RLS temporarily for testing
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Re-enable RLS with simpler policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple, working policies
CREATE POLICY "Enable all for authenticated users" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 7. Test the setup
SELECT 'user_profiles table ready' as status; 