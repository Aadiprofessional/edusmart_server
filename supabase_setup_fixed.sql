-- =============================================
-- COMPLETE SUPABASE SETUP FOR EDUSMART - FIXED VERSION
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop existing tables and start fresh
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create profiles table with correct structure
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_profiles table for extended profile information
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
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
    current_gpa DECIMAL(3,2),
    gpa_scale TEXT,
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
    
    -- Experience and Activities (stored as JSON arrays/text)
    extracurricular_activities JSONB DEFAULT '[]'::jsonb,
    career_goals TEXT,
    work_experience TEXT,
    research_experience TEXT,
    publications TEXT,
    awards TEXT,
    languages JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Information
    financial_aid_needed BOOLEAN DEFAULT false,
    scholarship_interests TEXT,
    
    -- Profile Management
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- 4. Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing policies first
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.user_profiles;

-- 6. Create RLS policies for profiles table
-- Allow service role to insert profiles (for the trigger)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Allow users to view and update their own profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7. Create RLS policies for user_profiles table
-- Allow users full access to their own user profiles
CREATE POLICY "Users can manage their own user_profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Function to handle new user signup (creates profile automatically)
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'user'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;

-- 14. Grant sequence permissions (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =============================================
-- SETUP COMPLETE - FIXED VERSION
-- =============================================

-- Test the setup by checking if tables exist
SELECT 'profiles table created' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
);

SELECT 'user_profiles table created' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
);

-- Show RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles'); 