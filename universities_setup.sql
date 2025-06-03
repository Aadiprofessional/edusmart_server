-- =============================================
-- UNIVERSITIES TABLE SETUP FOR EDUSMART
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop existing universities table if it exists
DROP TABLE IF EXISTS public.universities CASCADE;

-- 2. Create universities table with comprehensive structure
CREATE TABLE public.universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Information
    name TEXT NOT NULL,
    description TEXT,
    
    -- Location Information
    country TEXT NOT NULL,
    city TEXT,
    state TEXT,
    address TEXT,
    
    -- Contact Information
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Academic Information
    established_year INTEGER,
    type TEXT, -- Public, Private, etc.
    ranking INTEGER,
    
    -- Financial Information
    tuition_fee DECIMAL(12,2),
    application_fee DECIMAL(10,2),
    
    -- Statistics
    acceptance_rate DECIMAL(5,2), -- Percentage
    student_population INTEGER,
    faculty_count INTEGER,
    
    -- Programs and Facilities (stored as JSON arrays)
    programs_offered JSONB DEFAULT '[]'::jsonb,
    facilities JSONB DEFAULT '[]'::jsonb,
    
    -- Media
    image TEXT, -- URL to university image
    logo TEXT, -- URL to university logo
    gallery JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    
    -- Additional Information
    campus_size TEXT, -- e.g., "Large", "Medium", "Small"
    campus_type TEXT, -- e.g., "Urban", "Suburban", "Rural"
    accreditation TEXT,
    notable_alumni JSONB DEFAULT '[]'::jsonb,
    
    -- SEO and Search
    slug TEXT UNIQUE, -- URL-friendly version of name
    keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Status and Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    featured BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_by UUID, -- References the admin who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_city ON public.universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_ranking ON public.universities(ranking);
CREATE INDEX IF NOT EXISTS idx_universities_status ON public.universities(status);
CREATE INDEX IF NOT EXISTS idx_universities_featured ON public.universities(featured);
CREATE INDEX IF NOT EXISTS idx_universities_slug ON public.universities(slug);
CREATE INDEX IF NOT EXISTS idx_universities_created_by ON public.universities(created_by);

-- 4. Create full-text search index
CREATE INDEX IF NOT EXISTS idx_universities_search ON public.universities 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || city || ' ' || country));

-- 5. Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Allow everyone to read universities (public data)
CREATE POLICY "Universities are publicly readable" ON public.universities
    FOR SELECT USING (status = 'active');

-- Allow service role to manage all universities (for admin operations)
CREATE POLICY "Service role can manage universities" ON public.universities
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_universities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_universities_updated_at ON public.universities;
CREATE TRIGGER update_universities_updated_at 
    BEFORE UPDATE ON public.universities 
    FOR EACH ROW EXECUTE FUNCTION public.update_universities_updated_at();

-- 9. Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_university_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := trim(both '-' from NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for slug generation
DROP TRIGGER IF EXISTS generate_university_slug ON public.universities;
CREATE TRIGGER generate_university_slug 
    BEFORE INSERT OR UPDATE ON public.universities 
    FOR EACH ROW EXECUTE FUNCTION public.generate_university_slug();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.universities TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 12. Insert sample data
INSERT INTO public.universities (
    name, description, country, city, state, website, established_year, type, ranking,
    tuition_fee, acceptance_rate, student_population, programs_offered, facilities,
    contact_email, contact_phone, status, featured, verified
) VALUES 
(
    'Harvard University',
    'Harvard University is a private Ivy League research university in Cambridge, Massachusetts. Founded in 1636, Harvard is the oldest institution of higher education in the United States and among the most prestigious in the world.',
    'USA',
    'Cambridge',
    'Massachusetts',
    'https://www.harvard.edu',
    1636,
    'Private',
    1,
    54000.00,
    3.4,
    23000,
    '["Computer Science", "Medicine", "Law", "Business", "Engineering", "Liberal Arts", "Sciences"]'::jsonb,
    '["Harvard Library System", "Research Centers", "Sports Complex", "Dormitories", "Medical School", "Business School"]'::jsonb,
    'admissions@harvard.edu',
    '+1-617-495-1000',
    'active',
    true,
    true
),
(
    'Stanford University',
    'Stanford University is a private research university in Stanford, California. Known for its academic strength, wealth, proximity to Silicon Valley, and ranking as one of the world''s top universities.',
    'USA',
    'Stanford',
    'California',
    'https://www.stanford.edu',
    1885,
    'Private',
    2,
    56000.00,
    4.3,
    17000,
    '["Computer Science", "Engineering", "Business", "Medicine", "Law", "Education", "Earth Sciences"]'::jsonb,
    '["Stanford Libraries", "Research Institutes", "Athletic Facilities", "Student Housing", "Medical Center"]'::jsonb,
    'admission@stanford.edu',
    '+1-650-723-2300',
    'active',
    true,
    true
),
(
    'Massachusetts Institute of Technology',
    'MIT is a private research university in Cambridge, Massachusetts. It is often ranked among the world''s top universities and is particularly known for its programs in engineering and physical sciences.',
    'USA',
    'Cambridge',
    'Massachusetts',
    'https://www.mit.edu',
    1861,
    'Private',
    3,
    53000.00,
    6.7,
    11500,
    '["Engineering", "Computer Science", "Physics", "Mathematics", "Economics", "Biology", "Chemistry"]'::jsonb,
    '["MIT Libraries", "Research Labs", "Sports Complex", "Student Residences", "Innovation Centers"]'::jsonb,
    'admissions@mit.edu',
    '+1-617-253-1000',
    'active',
    true,
    true
),
(
    'University of Oxford',
    'The University of Oxford is a collegiate research university in Oxford, England. There is evidence of teaching as early as 1096, making it the oldest university in the English-speaking world.',
    'UK',
    'Oxford',
    'England',
    'https://www.ox.ac.uk',
    1096,
    'Public',
    4,
    45000.00,
    17.5,
    24000,
    '["Philosophy", "Politics", "Economics", "Medicine", "Law", "Engineering", "Sciences", "Humanities"]'::jsonb,
    '["Bodleian Libraries", "Research Departments", "Colleges", "Museums", "Sports Facilities"]'::jsonb,
    'admissions@ox.ac.uk',
    '+44-1865-270000',
    'active',
    true,
    true
),
(
    'University of Cambridge',
    'The University of Cambridge is a collegiate research university in Cambridge, United Kingdom. Founded in 1209, Cambridge is the second-oldest university in the English-speaking world.',
    'UK',
    'Cambridge',
    'England',
    'https://www.cam.ac.uk',
    1209,
    'Public',
    5,
    43000.00,
    21.0,
    23000,
    '["Natural Sciences", "Engineering", "Medicine", "Mathematics", "Computer Science", "Economics", "Law"]'::jsonb,
    '["University Library", "Research Centers", "Colleges", "Laboratories", "Sports Facilities"]'::jsonb,
    'admissions@cam.ac.uk',
    '+44-1223-337733',
    'active',
    true,
    true
),
(
    'University of Toronto',
    'The University of Toronto is a public research university in Toronto, Ontario, Canada, located on the grounds that surround Queen''s Park. It was founded by royal charter in 1827.',
    'Canada',
    'Toronto',
    'Ontario',
    'https://www.utoronto.ca',
    1827,
    'Public',
    18,
    35000.00,
    43.0,
    97000,
    '["Engineering", "Medicine", "Business", "Law", "Arts & Science", "Applied Science", "Music"]'::jsonb,
    '["Robarts Library", "Research Institutes", "Athletic Centers", "Student Residences", "Hospitals"]'::jsonb,
    'admissions@utoronto.ca',
    '+1-416-978-2011',
    'active',
    true,
    true
),
(
    'Australian National University',
    'The Australian National University is a public research university located in Canberra, the capital of Australia. It was founded in 1946 and is consistently ranked as one of the world''s leading universities.',
    'Australia',
    'Canberra',
    'Australian Capital Territory',
    'https://www.anu.edu.au',
    1946,
    'Public',
    27,
    28000.00,
    35.0,
    25000,
    '["Arts & Social Sciences", "Engineering", "Science", "Medicine", "Law", "Business", "Asia Pacific Studies"]'::jsonb,
    '["Chifley Library", "Research Schools", "Sports Facilities", "Student Accommodation", "Art Gallery"]'::jsonb,
    'admissions@anu.edu.au',
    '+61-2-6125-5111',
    'active',
    true,
    true
),
(
    'Technical University of Munich',
    'The Technical University of Munich is a public research university in Munich, Germany. It specializes in engineering, technology, medicine, and applied and natural sciences.',
    'Germany',
    'Munich',
    'Bavaria',
    'https://www.tum.de',
    1868,
    'Public',
    50,
    0.00,
    15.0,
    45000,
    '["Engineering", "Natural Sciences", "Life Sciences", "Medicine", "Economics", "Computer Science"]'::jsonb,
    '["TUM Library", "Research Centers", "Sports Facilities", "Student Housing", "Technology Centers"]'::jsonb,
    'studium@tum.de',
    '+49-89-289-01',
    'active',
    true,
    true
);

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Test the setup
SELECT 'Universities table created successfully' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'universities'
);

-- Show sample data
SELECT name, country, city, ranking, student_population 
FROM public.universities 
ORDER BY ranking 
LIMIT 5; 