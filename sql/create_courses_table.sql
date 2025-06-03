-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('programming', 'data-science', 'business', 'design', 'marketing', 'language', 'test-prep', 'academic')),
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration VARCHAR(50) NOT NULL, -- e.g., "8 weeks", "3 months", "Self-paced"
    price DECIMAL(10,2) DEFAULT 0.00,
    original_price DECIMAL(10,2),
    image TEXT,
    instructor_name VARCHAR(100) NOT NULL,
    instructor_bio TEXT,
    instructor_image TEXT,
    syllabus JSONB, -- Course modules/lessons structure
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    skills_gained TEXT[],
    language VARCHAR(20) DEFAULT 'English',
    certificate BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    video_preview_url TEXT,
    course_materials JSONB, -- Links to resources, files, etc.
    tags TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- Create a GIN index for tags array for better search performance
CREATE INDEX IF NOT EXISTS idx_courses_tags ON courses USING GIN(tags);

-- Create a text search index for title and description
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING GIN(to_tsvector('english', title || ' ' || description));

-- Add RLS (Row Level Security) policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access
CREATE POLICY "Allow public read access" ON courses
    FOR SELECT USING (true);

-- Policy to allow admin users to insert/update/delete
CREATE POLICY "Allow admin full access" ON courses
    FOR ALL USING (true);

-- Add some sample data
INSERT INTO courses (title, description, category, level, duration, price, original_price, image, instructor_name, instructor_bio, syllabus, prerequisites, learning_outcomes, skills_gained, featured, tags, created_by) VALUES
('Complete Web Development Bootcamp', 'Master modern web development with HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and launch your career as a full-stack developer.', 'programming', 'beginner', '16 weeks', 199.99, 299.99, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Sarah Johnson', 'Senior Full-Stack Developer with 8+ years of experience at top tech companies. Passionate about teaching and helping students launch their tech careers.', '{"modules": [{"title": "HTML & CSS Fundamentals", "lessons": 12}, {"title": "JavaScript Essentials", "lessons": 15}, {"title": "React Development", "lessons": 18}, {"title": "Backend with Node.js", "lessons": 14}, {"title": "Database Design", "lessons": 10}, {"title": "Full-Stack Projects", "lessons": 8}]}', ARRAY['Basic computer skills', 'No programming experience required'], ARRAY['Build responsive websites', 'Create dynamic web applications', 'Understand full-stack development', 'Deploy applications to production'], ARRAY['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'], true, ARRAY['Web Development', 'Full Stack', 'JavaScript', 'React', 'Node.js'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Data Science with Python', 'Learn data analysis, machine learning, and visualization using Python. Work with real datasets and build predictive models for business insights.', 'data-science', 'intermediate', '12 weeks', 249.99, 349.99, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Dr. Michael Chen', 'PhD in Computer Science, former Google data scientist with expertise in machine learning and statistical analysis.', '{"modules": [{"title": "Python for Data Science", "lessons": 10}, {"title": "Data Analysis with Pandas", "lessons": 12}, {"title": "Data Visualization", "lessons": 8}, {"title": "Machine Learning Basics", "lessons": 15}, {"title": "Advanced ML Techniques", "lessons": 12}, {"title": "Real-World Projects", "lessons": 6}]}', ARRAY['Basic Python knowledge', 'Statistics fundamentals'], ARRAY['Analyze complex datasets', 'Build machine learning models', 'Create data visualizations', 'Make data-driven decisions'], ARRAY['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'Jupyter'], false, ARRAY['Data Science', 'Python', 'Machine Learning', 'Analytics'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Digital Marketing Mastery', 'Complete guide to digital marketing including SEO, social media, content marketing, PPC, and analytics. Perfect for entrepreneurs and marketers.', 'marketing', 'beginner', '10 weeks', 149.99, 199.99, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Emma Rodriguez', 'Digital Marketing Director with 10+ years experience helping brands grow online. Certified Google and Facebook marketing expert.', '{"modules": [{"title": "Digital Marketing Fundamentals", "lessons": 8}, {"title": "SEO & Content Marketing", "lessons": 12}, {"title": "Social Media Marketing", "lessons": 10}, {"title": "PPC & Paid Advertising", "lessons": 9}, {"title": "Email Marketing", "lessons": 7}, {"title": "Analytics & Optimization", "lessons": 8}]}', ARRAY['Basic computer skills', 'Interest in marketing'], ARRAY['Create effective marketing campaigns', 'Optimize for search engines', 'Manage social media presence', 'Analyze marketing performance'], ARRAY['SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Analytics'], true, ARRAY['Digital Marketing', 'SEO', 'Social Media', 'PPC'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('UX/UI Design Fundamentals', 'Learn user experience and interface design principles. Master design tools and create beautiful, user-friendly digital products.', 'design', 'beginner', '8 weeks', 179.99, 249.99, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Alex Thompson', 'Senior UX Designer at leading design agency. Specializes in user research and interface design for mobile and web applications.', '{"modules": [{"title": "Design Thinking Process", "lessons": 6}, {"title": "User Research Methods", "lessons": 8}, {"title": "Wireframing & Prototyping", "lessons": 10}, {"title": "Visual Design Principles", "lessons": 9}, {"title": "Design Tools Mastery", "lessons": 12}, {"title": "Portfolio Development", "lessons": 5}]}', ARRAY['Creative mindset', 'Basic computer skills'], ARRAY['Understand user-centered design', 'Create wireframes and prototypes', 'Design beautiful interfaces', 'Build a professional portfolio'], ARRAY['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Visual Design'], false, ARRAY['UX Design', 'UI Design', 'Figma', 'Prototyping'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('IELTS Preparation Course', 'Comprehensive IELTS preparation covering all four skills: Listening, Reading, Writing, and Speaking. Achieve your target band score.', 'test-prep', 'intermediate', '6 weeks', 99.99, 149.99, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'James Wilson', 'Certified IELTS instructor with 12+ years experience. Former IELTS examiner with deep understanding of scoring criteria.', '{"modules": [{"title": "IELTS Overview & Strategy", "lessons": 4}, {"title": "Listening Skills", "lessons": 8}, {"title": "Reading Techniques", "lessons": 10}, {"title": "Writing Task 1 & 2", "lessons": 12}, {"title": "Speaking Practice", "lessons": 10}, {"title": "Mock Tests & Review", "lessons": 6}]}', ARRAY['Intermediate English level', 'Basic test-taking experience'], ARRAY['Master all IELTS sections', 'Improve band score by 1-2 points', 'Develop test strategies', 'Build confidence for exam day'], ARRAY['IELTS Strategy', 'Academic Writing', 'Speaking Fluency', 'Test Techniques'], true, ARRAY['IELTS', 'English Test', 'Test Prep', 'Academic English'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Business Analytics with Excel', 'Master Excel for business analysis, data visualization, and reporting. Learn advanced formulas, pivot tables, and dashboard creation.', 'business', 'intermediate', '6 weeks', 129.99, 179.99, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Lisa Park', 'Business Intelligence Analyst with MBA and 8+ years experience in corporate analytics and reporting.', '{"modules": [{"title": "Excel Fundamentals Review", "lessons": 5}, {"title": "Advanced Formulas & Functions", "lessons": 10}, {"title": "Data Analysis Tools", "lessons": 8}, {"title": "Pivot Tables Mastery", "lessons": 9}, {"title": "Charts & Dashboards", "lessons": 7}, {"title": "Business Case Studies", "lessons": 6}]}', ARRAY['Basic Excel knowledge', 'Business fundamentals'], ARRAY['Create professional reports', 'Build interactive dashboards', 'Analyze business data', 'Make data-driven recommendations'], ARRAY['Excel', 'Data Analysis', 'Pivot Tables', 'Business Intelligence'], false, ARRAY['Excel', 'Business Analytics', 'Data Analysis', 'Reporting'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Spanish for Beginners', 'Start your Spanish learning journey with interactive lessons, practical conversations, and cultural insights. Perfect for complete beginners.', 'language', 'beginner', '12 weeks', 89.99, 129.99, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Carlos Mendez', 'Native Spanish speaker and certified language instructor with 15+ years teaching experience across multiple countries.', '{"modules": [{"title": "Spanish Basics & Pronunciation", "lessons": 8}, {"title": "Essential Vocabulary", "lessons": 10}, {"title": "Grammar Fundamentals", "lessons": 12}, {"title": "Conversational Spanish", "lessons": 15}, {"title": "Cultural Context", "lessons": 6}, {"title": "Practice & Assessment", "lessons": 9}]}', ARRAY['No Spanish experience required', 'Enthusiasm to learn'], ARRAY['Hold basic conversations', 'Understand Spanish grammar', 'Build vocabulary foundation', 'Appreciate Hispanic culture'], ARRAY['Spanish Speaking', 'Grammar', 'Vocabulary', 'Cultural Awareness'], false, ARRAY['Spanish', 'Language Learning', 'Beginner', 'Conversation'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'),

('Academic Writing Excellence', 'Master academic writing skills for university success. Learn research methods, citation styles, and how to write compelling essays and papers.', 'academic', 'intermediate', '8 weeks', 119.99, 159.99, 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80', 'Dr. Rachel Green', 'PhD in English Literature, university professor with 20+ years experience teaching academic writing and research methods.', '{"modules": [{"title": "Academic Writing Principles", "lessons": 6}, {"title": "Research & Sources", "lessons": 8}, {"title": "Essay Structure & Organization", "lessons": 10}, {"title": "Citation & Referencing", "lessons": 7}, {"title": "Critical Analysis", "lessons": 9}, {"title": "Revision & Editing", "lessons": 6}]}', ARRAY['University-level English', 'Basic research experience'], ARRAY['Write clear academic papers', 'Conduct effective research', 'Master citation styles', 'Develop critical thinking'], ARRAY['Academic Writing', 'Research Methods', 'Critical Analysis', 'Citation'], true, ARRAY['Academic Writing', 'Research', 'University', 'Essays'], 'bca2f806-29c5-4be9-bc2d-a484671546cd'); 