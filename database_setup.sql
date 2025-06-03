-- Fix Row Level Security for profiles table
-- Option 1: Disable RLS temporarily for testing (not recommended for production)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies (recommended)
-- First, enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Update profiles table structure for Supabase Auth integration
-- Remove password column if it exists (Supabase Auth handles this)
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- Ensure profiles table has correct structure
-- Note: Run this only if the table doesn't exist or needs to be recreated
/*
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Create policies for profiles table
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" ON profiles
    FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- Create user_profiles table for extended profile information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
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

-- Enable RLS for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles table
CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users based on user_id" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Function to handle new user signup
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

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 