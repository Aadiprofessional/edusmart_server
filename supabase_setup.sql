-- =============================================
-- COMPLETE SUPABASE SETUP FOR EDUSMART
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. First, let's ensure the profiles table has the correct structure
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_profiles table for extended profile information
DROP TABLE IF EXISTS public.user_profiles CASCADE;
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

-- 3. Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;

-- 5. Create RLS policies for profiles table
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Create RLS policies for user_profiles table
CREATE POLICY "Users can insert their own user_profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own user_profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Function to handle new user signup (creates profile automatically)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- =============================================
-- SETUP COMPLETE
-- ============================================= 