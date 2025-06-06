-- =============================================
-- RECREATE TABLES WITH FIXED RLS POLICIES
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. DISABLE RLS AND DROP EXISTING TABLES
-- =============================================

-- Disable RLS first to avoid conflicts
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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
DROP POLICY IF EXISTS "Allow users to insert own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to select own user_profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.profiles;

-- Drop existing tables (this will cascade and remove foreign keys)
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 2. CREATE PROFILES TABLE
-- =============================================
-- This table stores basic user information and directly references auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- 3. CREATE USER_PROFILES TABLE  
-- =============================================
-- This table stores detailed academic profile information
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Information
    full_name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Personal Information
    date_of_birth DATE,
    nationality TEXT,
    current_location TEXT,
    preferred_study_location TEXT,
    
    -- Academic Information
    current_education_level TEXT,
    current_institution TEXT,
    current_gpa NUMERIC,
    gpa_scale TEXT DEFAULT '4.0',
    graduation_year TEXT,
    field_of_study TEXT,
    preferred_field TEXT,
    
    -- Test Scores
    sat_score INTEGER,
    act_score INTEGER,
    gre_score INTEGER,
    gmat_score INTEGER,
    toefl_score INTEGER,
    ielts_score INTEGER,
    duolingo_score INTEGER,
    
    -- Preferences
    preferred_degree_level TEXT,
    budget_range TEXT,
    preferred_university_size TEXT,
    preferred_campus_type TEXT,
    preferred_program_type TEXT,
    
    -- Experience and Goals
    career_goals TEXT,
    work_experience TEXT,
    research_experience TEXT,
    publications TEXT,
    awards TEXT,
    
    -- Activities and Skills (JSONB for arrays)
    extracurricular_activities JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Information
    financial_aid_needed BOOLEAN DEFAULT false,
    scholarship_interests TEXT,
    
    -- Profile Management
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_completion ON public.user_profiles(profile_completion_percentage);

-- 5. CREATE UPDATED_AT TRIGGERS
-- =============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for both tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. GRANT PERMISSIONS FIRST (BEFORE ENABLING RLS)
-- =============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. ENABLE RLS AND CREATE WORKING POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES (Allow service role to manage everything)
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER_PROFILES TABLE POLICIES (Allow service role to manage everything)
CREATE POLICY "Service role full access user_profiles" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage own user_profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. CREATE FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'user'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If profile creation fails, still allow user creation
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. INSERT PROFILE FOR EXISTING USER (if not exists)
-- =============================================
-- This ensures the current test user has a profile
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email) as name,
    'user' as role
FROM auth.users 
WHERE email = 'matrixai.global@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();

-- 10. VERIFICATION
-- =============================================

-- Show table structure
SELECT 'Tables created successfully' as status;

-- Show the test user's profile
SELECT 'Test user profile:' as info, * FROM public.profiles WHERE email = 'matrixai.global@gmail.com';

-- Show foreign key relationships
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
    AND tc.table_name IN ('profiles', 'user_profiles')
    AND tc.table_schema = 'public';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles')
ORDER BY tablename, policyname; 