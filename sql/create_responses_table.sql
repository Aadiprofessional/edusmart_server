-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('guide', 'template', 'checklist', 'video', 'webinar', 'ebook')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('application', 'study', 'test-prep', 'career')),
    url TEXT,
    file_size VARCHAR(20),
    thumbnail TEXT,
    download_link TEXT,
    video_link TEXT,
    featured BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    downloads INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_responses_type ON responses(type);
CREATE INDEX IF NOT EXISTS idx_responses_category ON responses(category);
CREATE INDEX IF NOT EXISTS idx_responses_featured ON responses(featured);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_created_by ON responses(created_by);

-- Create a GIN index for tags array for better search performance
CREATE INDEX IF NOT EXISTS idx_responses_tags ON responses USING GIN(tags);

-- Create a text search index for title and description
CREATE INDEX IF NOT EXISTS idx_responses_search ON responses USING GIN(to_tsvector('english', title || ' ' || description));

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access
CREATE POLICY "Allow public read access" ON responses
    FOR SELECT USING (true);

-- Policy to allow admin users to insert/update/delete (simplified)
CREATE POLICY "Allow admin full access" ON responses
    FOR ALL USING (true);

-- Add some sample data
INSERT INTO responses (title, description, type, category, url, thumbnail, download_link, featured, tags, created_by) VALUES
('Ultimate Graduate School Application Guide', 'A comprehensive guide covering every aspect of the graduate school application process, from selecting programs to acing interviews.', 'guide', 'application', '/resources/guides/graduate-application-guide.pdf', 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/guides/graduate-application-guide.pdf', true, ARRAY['SOP', 'CV', 'Recommendations', 'Interview'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Statement of Purpose Templates & Examples', 'A collection of successful SOP templates and examples for various programs, with annotations explaining effective strategies.', 'template', 'application', '/resources/templates/sop-templates.zip', 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/templates/sop-templates.zip', false, ARRAY['SOP', 'Writing', 'Examples'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('GRE Preparation Masterclass', 'A comprehensive video course covering all GRE sections with proven strategies to maximize your score.', 'video', 'test-prep', 'https://www.youtube.com/watch?v=example', 'https://images.unsplash.com/photo-1606326608690-4e0281b1e588?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', null, false, ARRAY['GRE', 'Test Prep', 'Strategies'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('University Application Checklist', 'A detailed checklist to ensure you don''t miss any important steps or deadlines in your application process.', 'checklist', 'application', '/resources/checklists/application-checklist.pdf', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/checklists/application-checklist.pdf', false, ARRAY['Organization', 'Deadlines', 'Planning'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Academic Research Methods Guide', 'Learn essential research methodologies, data analysis techniques, and academic writing standards for graduate-level research.', 'ebook', 'study', '/resources/ebooks/research-methods.pdf', 'https://images.unsplash.com/photo-1532153955177-f59af40d6472?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/ebooks/research-methods.pdf', true, ARRAY['Research', 'Academia', 'Writing', 'Data Analysis'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('IELTS Speaking Practice Webinar', 'Interactive webinar with speaking practice exercises and expert feedback to boost your IELTS speaking score.', 'webinar', 'test-prep', 'https://www.example.com/webinars/ielts-speaking', 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', null, false, ARRAY['IELTS', 'Speaking', 'English Proficiency'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Graduate CV & Resume Templates', 'Professional CV and resume templates specifically designed for graduate students and recent graduates.', 'template', 'career', '/resources/templates/cv-templates.zip', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/templates/cv-templates.zip', false, ARRAY['CV', 'Resume', 'Job Application'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('PhD Funding Guide', 'Comprehensive guide to finding and securing funding for your PhD, including scholarships, grants, and assistantships.', 'guide', 'application', '/resources/guides/phd-funding-guide.pdf', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/guides/phd-funding-guide.pdf', false, ARRAY['Funding', 'Scholarships', 'PhD', 'Grants'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Academic Networking Strategies', 'Learn how to build and leverage academic and professional networks to advance your research and career.', 'ebook', 'career', '/resources/ebooks/academic-networking.pdf', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80', '/resources/ebooks/academic-networking.pdf', false, ARRAY['Networking', 'Professional Development', 'Conferences'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'); 