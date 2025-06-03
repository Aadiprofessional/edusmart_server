-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- References auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
    nationality VARCHAR(100),
    country_of_residence VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(20),
    profile_image TEXT,
    bio TEXT,
    
    -- Educational Background
    current_education_level VARCHAR(50) CHECK (current_education_level IN ('high-school', 'undergraduate', 'graduate', 'postgraduate', 'phd', 'professional')),
    field_of_study VARCHAR(200),
    institution VARCHAR(200),
    graduation_year INTEGER,
    gpa DECIMAL(4,2),
    gpa_scale VARCHAR(10), -- e.g., "4.0", "10.0", "100"
    
    -- Test Scores
    test_scores JSONB, -- Store various test scores (GRE, IELTS, TOEFL, SAT, etc.)
    
    -- Career Information
    current_occupation VARCHAR(200),
    work_experience_years INTEGER DEFAULT 0,
    industry VARCHAR(100),
    company VARCHAR(200),
    job_title VARCHAR(200),
    
    -- Application Preferences
    target_countries TEXT[], -- Countries interested in studying
    target_programs TEXT[], -- Programs interested in
    target_universities TEXT[], -- Universities interested in
    budget_range VARCHAR(50), -- e.g., "0-10000", "10000-25000", "25000-50000", "50000+"
    preferred_intake VARCHAR(20), -- e.g., "fall", "spring", "summer"
    application_year INTEGER,
    
    -- Interests and Goals
    interests TEXT[],
    career_goals TEXT,
    study_goals TEXT,
    extracurricular_activities TEXT[],
    languages_spoken TEXT[],
    
    -- Application Status
    application_status VARCHAR(30) DEFAULT 'planning' CHECK (application_status IN ('planning', 'preparing', 'applying', 'admitted', 'enrolled', 'completed')),
    counselor_assigned UUID, -- Reference to counselor/admin
    
    -- Preferences
    communication_preferences JSONB, -- Email, SMS, call preferences
    privacy_settings JSONB, -- Privacy preferences
    notification_settings JSONB, -- Notification preferences
    
    -- Metadata
    profile_completion_percentage INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB, -- Store verification document info
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country_of_residence);
CREATE INDEX IF NOT EXISTS idx_user_profiles_education_level ON user_profiles(current_education_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_field_of_study ON user_profiles(field_of_study);
CREATE INDEX IF NOT EXISTS idx_user_profiles_application_status ON user_profiles(application_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_counselor ON user_profiles(counselor_assigned);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Create a GIN index for arrays
CREATE INDEX IF NOT EXISTS idx_user_profiles_target_countries ON user_profiles USING GIN(target_countries);
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN(interests);

-- Create a text search index for name and bio
CREATE INDEX IF NOT EXISTS idx_user_profiles_search ON user_profiles USING GIN(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(bio, '')));

-- Add RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow admin users to read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
    FOR SELECT USING (true);

-- Policy to allow admin users to update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (true);

-- Add some sample data
INSERT INTO user_profiles (user_id, email, first_name, last_name, full_name, phone, nationality, country_of_residence, city, current_education_level, field_of_study, institution, graduation_year, target_countries, target_programs, application_status, interests, career_goals) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John', 'Doe', 'John Doe', '+1-555-0123', 'American', 'United States', 'New York', 'undergraduate', 'Computer Science', 'New York University', 2024, ARRAY['United Kingdom', 'Canada', 'Australia'], ARRAY['Master of Science in Computer Science', 'Master of Science in Data Science'], 'preparing', ARRAY['Machine Learning', 'Software Development', 'Research'], 'To become a leading AI researcher and contribute to breakthrough technologies'),

('550e8400-e29b-41d4-a716-446655440002', 'sarah.smith@example.com', 'Sarah', 'Smith', 'Sarah Smith', '+1-555-0124', 'Canadian', 'Canada', 'Toronto', 'graduate', 'Business Administration', 'University of Toronto', 2023, ARRAY['United States', 'United Kingdom'], ARRAY['Master of Business Administration'], 'applying', ARRAY['Entrepreneurship', 'Finance', 'Leadership'], 'To start my own tech company and create innovative solutions for global challenges'),

('550e8400-e29b-41d4-a716-446655440003', 'raj.patel@example.com', 'Raj', 'Patel', 'Raj Patel', '+91-98765-43210', 'Indian', 'India', 'Mumbai', 'undergraduate', 'Mechanical Engineering', 'Indian Institute of Technology Bombay', 2024, ARRAY['United States', 'Germany', 'Netherlands'], ARRAY['Master of Science in Mechanical Engineering', 'Master of Science in Robotics'], 'planning', ARRAY['Robotics', 'Automation', 'Innovation'], 'To work on cutting-edge robotics projects and advance automation technology'),

('550e8400-e29b-41d4-a716-446655440004', 'maria.garcia@example.com', 'Maria', 'Garcia', 'Maria Garcia', '+34-612-345-678', 'Spanish', 'Spain', 'Madrid', 'graduate', 'Psychology', 'Universidad Complutense Madrid', 2022, ARRAY['United States', 'United Kingdom', 'Australia'], ARRAY['Doctor of Philosophy in Clinical Psychology'], 'admitted', ARRAY['Clinical Psychology', 'Research', 'Mental Health'], 'To become a licensed clinical psychologist and help people overcome mental health challenges'),

('550e8400-e29b-41d4-a716-446655440005', 'ahmed.hassan@example.com', 'Ahmed', 'Hassan', 'Ahmed Hassan', '+20-10-1234-5678', 'Egyptian', 'Egypt', 'Cairo', 'undergraduate', 'Economics', 'American University in Cairo', 2025, ARRAY['United States', 'Canada', 'United Kingdom'], ARRAY['Master of Arts in Economics', 'Master of Public Policy'], 'planning', ARRAY['Economic Policy', 'Development Economics', 'Research'], 'To work in international development and help create economic policies that reduce poverty'); 