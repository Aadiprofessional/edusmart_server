-- =============================================
-- FIX RLS POLICIES FOR CORRECT SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. First, let's check the current foreign key relationship
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='user_profiles'
    AND tc.table_schema='public';

-- 2. Drop all existing policies for user_profiles
DROP POLICY IF EXISTS "Users can insert their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to view own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to delete own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_profiles;

-- 3. Ensure the foreign key constraint is correct
-- If user_profiles.user_id should reference profiles.id (not auth.users.id)
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Create new policies that work with the correct schema
-- Policy for INSERT: Allow users to create their own user_profile
CREATE POLICY "Allow users to insert own user_profile" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy for SELECT: Allow users to view their own user_profile
CREATE POLICY "Allow users to select own user_profile" ON public.user_profiles
    FOR SELECT 
    USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy for UPDATE: Allow users to update their own user_profile
CREATE POLICY "Allow users to update own user_profile" ON public.user_profiles
    FOR UPDATE 
    USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy for DELETE: Allow users to delete their own user_profile
CREATE POLICY "Allow users to delete own user_profile" ON public.user_profiles
    FOR DELETE 
    USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 5. Also ensure profiles table has proper policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage profiles (for automatic profile creation)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert profiles (for signup)
CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 7. Verify the setup
SELECT 'RLS policies updated for correct schema' as status;

-- 8. Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles')
ORDER BY tablename, policyname; 