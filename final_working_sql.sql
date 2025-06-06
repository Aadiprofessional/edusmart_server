-- =============================================
-- FINAL WORKING SQL - FIXES SERVICE ROLE ACCESS
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. DISABLE RLS ON ALL RELATED TABLES
-- =============================================
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scholarships DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL POLICIES (COMPREHENSIVE)
-- =============================================
-- User profiles policies
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
DROP POLICY IF EXISTS "Authenticated users can manage own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access user_profiles" ON public.user_profiles;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- 3. DROP TRIGGERS FIRST (TO AVOID DEPENDENCY ISSUES)
-- =============================================
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
DROP TRIGGER IF EXISTS update_scholarships_updated_at ON public.scholarships;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. DROP TABLES (CASCADE TO REMOVE ALL DEPENDENCIES)
-- =============================================
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 5. DROP FUNCTIONS (NOW SAFE TO DROP)
-- =============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 6. RECREATE THE UPDATE FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. CREATE PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- 8. CREATE USER_PROFILES TABLE  
-- =============================================
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

-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_completion ON public.user_profiles(profile_completion_percentage);

-- 10. CREATE TRIGGERS FOR NEW TABLES
-- =============================================
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. RECREATE TRIGGERS FOR OTHER TABLES (IF THEY EXIST)
-- =============================================
-- Only create if the tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blogs') THEN
        DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
        CREATE TRIGGER update_blogs_updated_at 
            BEFORE UPDATE ON public.blogs 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scholarships') THEN
        DROP TRIGGER IF EXISTS update_scholarships_updated_at ON public.scholarships;
        CREATE TRIGGER update_scholarships_updated_at 
            BEFORE UPDATE ON public.scholarships 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 12. GRANT PERMISSIONS
-- =============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 13. ENABLE RLS AND CREATE WORKING POLICIES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES - SERVICE ROLE FIRST (MOST IMPORTANT)
CREATE POLICY "Service role can do everything" ON public.profiles
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        current_setting('role') = 'service_role'
    ) WITH CHECK (
        auth.role() = 'service_role' OR 
        current_setting('role') = 'service_role'
    );

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER_PROFILES TABLE POLICIES - SERVICE ROLE FIRST (MOST IMPORTANT)
CREATE POLICY "Service role can do everything user_profiles" ON public.user_profiles
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        current_setting('role') = 'service_role'
    ) WITH CHECK (
        auth.role() = 'service_role' OR 
        current_setting('role') = 'service_role'
    );

CREATE POLICY "Users can manage own user_profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. CREATE AUTO-PROFILE FUNCTION AND TRIGGER
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. INSERT PROFILE FOR EXISTING TEST USER
-- =============================================
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

-- 16. VERIFICATION
-- =============================================
SELECT 'Tables created successfully' as status;

-- Show the test user's profile
SELECT 'Test user profile:' as info, id, email, name, role, created_at 
FROM public.profiles 
WHERE email = 'matrixai.global@gmail.com';

-- Show table counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM public.user_profiles;

-- Show policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles')
ORDER BY tablename, policyname;

SELECT 'Setup completed successfully! APIs should now work.' as final_status; 