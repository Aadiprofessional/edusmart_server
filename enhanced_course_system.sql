-- =============================================
-- ENHANCED COURSE SYSTEM - UDEMY-LIKE PLATFORM
-- Complete database schema with storage buckets
-- =============================================

-- 1. CREATE STORAGE BUCKETS FOR COURSE CONTENT
-- =============================================

-- Create bucket for course videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos',
  'course-videos',
  false,
  1073741824, -- 1GB limit per file
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for course materials (PDFs, docs, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  false,
  104857600, -- 100MB limit per file
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for course images and thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for instructor profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instructor-images',
  'instructor-images',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE POLICIES
-- =============================================

-- Course videos - only authenticated users can view, only admins can upload
CREATE POLICY "Authenticated users can view course videos" ON storage.objects
FOR SELECT USING (bucket_id = 'course-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload course videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'course-videos' AND auth.role() = 'service_role');

CREATE POLICY "Admins can update course videos" ON storage.objects
FOR UPDATE USING (bucket_id = 'course-videos' AND auth.role() = 'service_role');

CREATE POLICY "Admins can delete course videos" ON storage.objects
FOR DELETE USING (bucket_id = 'course-videos' AND auth.role() = 'service_role');

-- Course materials - similar to videos
CREATE POLICY "Authenticated users can view course materials" ON storage.objects
FOR SELECT USING (bucket_id = 'course-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage course materials" ON storage.objects
FOR ALL USING (bucket_id = 'course-materials' AND auth.role() = 'service_role');

-- Course images - public read, admin write
CREATE POLICY "Public can view course images" ON storage.objects
FOR SELECT USING (bucket_id = 'course-images');

CREATE POLICY "Admins can manage course images" ON storage.objects
FOR ALL USING (bucket_id = 'course-images' AND auth.role() = 'service_role');

-- Instructor images - public read, admin write
CREATE POLICY "Public can view instructor images" ON storage.objects
FOR SELECT USING (bucket_id = 'instructor-images');

CREATE POLICY "Admins can manage instructor images" ON storage.objects
FOR ALL USING (bucket_id = 'instructor-images' AND auth.role() = 'service_role');

-- 3. ENHANCED COURSES TABLE
-- =============================================

-- Drop existing courses table if it exists
DROP TABLE IF EXISTS public.courses CASCADE;

-- Create enhanced courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all-levels')),
    language VARCHAR(20) DEFAULT 'English',
    
    -- Pricing
    price DECIMAL(10,2) DEFAULT 0.00,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Course metadata
    duration_hours DECIMAL(5,2), -- Total course duration in hours
    total_lectures INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 0,
    
    -- Media
    thumbnail_image TEXT,
    preview_video_url TEXT,
    
    -- Instructor information
    instructor_id UUID REFERENCES public.profiles(id),
    instructor_name VARCHAR(100) NOT NULL,
    instructor_bio TEXT,
    instructor_image TEXT,
    
    -- Course content
    what_you_will_learn TEXT[], -- Array of learning outcomes
    prerequisites TEXT[], -- Array of prerequisites
    target_audience TEXT[], -- Who this course is for
    course_includes TEXT[], -- What's included (videos, articles, etc.)
    
    -- SEO and marketing
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[],
    meta_description TEXT,
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    bestseller BOOLEAN DEFAULT FALSE,
    new_course BOOLEAN DEFAULT TRUE,
    
    -- Statistics
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    
    -- Certificates and completion
    certificate_available BOOLEAN DEFAULT TRUE,
    completion_certificate_template TEXT,
    
    -- Timestamps
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_duration CHECK (duration_hours > 0)
);

-- 4. COURSE SECTIONS TABLE
-- =============================================

CREATE TABLE public.course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    section_order INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(course_id, section_order)
);

-- 5. COURSE LECTURES TABLE
-- =============================================

CREATE TABLE public.course_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    lecture_type VARCHAR(20) NOT NULL CHECK (lecture_type IN ('video', 'article', 'quiz', 'assignment', 'resource')),
    
    -- Content
    video_url TEXT,
    video_duration_seconds INTEGER,
    article_content TEXT,
    resource_url TEXT,
    
    -- Order and settings
    lecture_order INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(section_id, lecture_order)
);

-- 6. COURSE ENROLLMENTS TABLE
-- =============================================

CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- Enrollment details
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    price_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    
    -- Progress tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_lectures INTEGER DEFAULT 0,
    total_lectures INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Certificate
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_issued_at TIMESTAMP WITH TIME ZONE,
    certificate_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'refunded')),
    
    UNIQUE(user_id, course_id)
);

-- 7. LECTURE PROGRESS TABLE
-- =============================================

CREATE TABLE public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.course_lectures(id) ON DELETE CASCADE,
    
    -- Progress details
    completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    first_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, lecture_id)
);

-- 8. COURSE REVIEWS TABLE
-- =============================================

CREATE TABLE public.course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    
    -- Helpful votes
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

-- 9. COURSE CATEGORIES TABLE
-- =============================================

CREATE TABLE public.course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    parent_id UUID REFERENCES public.course_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. COURSE WISHLISTS TABLE
-- =============================================

CREATE TABLE public.course_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

-- 11. COURSE COUPONS TABLE
-- =============================================

CREATE TABLE public.course_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. INDEXES FOR PERFORMANCE
-- =============================================

-- Courses indexes
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_featured ON public.courses(featured);
CREATE INDEX idx_courses_rating ON public.courses(rating DESC);
CREATE INDEX idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_search ON public.courses USING GIN(to_tsvector('english', title || ' ' || description));

-- Course sections indexes
CREATE INDEX idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX idx_course_sections_order ON public.course_sections(course_id, section_order);

-- Course lectures indexes
CREATE INDEX idx_course_lectures_section_id ON public.course_lectures(section_id);
CREATE INDEX idx_course_lectures_course_id ON public.course_lectures(course_id);
CREATE INDEX idx_course_lectures_order ON public.course_lectures(section_id, lecture_order);

-- Enrollments indexes
CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON public.course_enrollments(status);

-- Progress indexes
CREATE INDEX idx_lecture_progress_user_course ON public.lecture_progress(user_id, course_id);
CREATE INDEX idx_lecture_progress_lecture ON public.lecture_progress(lecture_id);

-- Reviews indexes
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_course_reviews_rating ON public.course_reviews(rating DESC);

-- 13. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update course statistics when enrollment changes
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total students count
    UPDATE public.courses 
    SET total_students = (
        SELECT COUNT(*) 
        FROM public.course_enrollments 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        AND status = 'active'
    )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- Update course rating when review changes
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.courses 
    SET 
        rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM public.course_reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
            AND status = 'published'
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM public.course_reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
            AND status = 'published'
        )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
    FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- Update section duration when lecture changes
CREATE OR REPLACE FUNCTION update_section_duration()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.course_sections 
    SET duration_minutes = (
        SELECT COALESCE(SUM(CEIL(video_duration_seconds / 60.0)), 0)
        FROM public.course_lectures 
        WHERE section_id = COALESCE(NEW.section_id, OLD.section_id)
    )
    WHERE id = COALESCE(NEW.section_id, OLD.section_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_section_duration
    AFTER INSERT OR UPDATE OR DELETE ON public.course_lectures
    FOR EACH ROW EXECUTE FUNCTION update_section_duration();

-- 14. RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_coupons ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Public can view published courses" ON public.courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all courses" ON public.courses
    FOR ALL USING (auth.role() = 'service_role');

-- Course sections and lectures - visible to enrolled users and admins
CREATE POLICY "Enrolled users can view course content" ON public.course_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.course_enrollments 
            WHERE course_id = course_sections.course_id 
            AND user_id = auth.uid()
            AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY "Enrolled users can view lectures" ON public.course_lectures
    FOR SELECT USING (
        is_preview = true OR
        EXISTS (
            SELECT 1 FROM public.course_enrollments 
            WHERE course_id = course_lectures.course_id 
            AND user_id = auth.uid()
            AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

-- Enrollments - users can view their own
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments
    FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage enrollments" ON public.course_enrollments
    FOR ALL USING (auth.role() = 'service_role');

-- Progress - users can manage their own
CREATE POLICY "Users can manage own progress" ON public.lecture_progress
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Reviews - public read, users can manage their own
CREATE POLICY "Public can view published reviews" ON public.course_reviews
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage own reviews" ON public.course_reviews
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Categories - public read, admin write
CREATE POLICY "Public can view active categories" ON public.course_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.course_categories
    FOR ALL USING (auth.role() = 'service_role');

-- Wishlists - users can manage their own
CREATE POLICY "Users can manage own wishlist" ON public.course_wishlists
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Coupons - public can view active ones, admins can manage
CREATE POLICY "Public can view active coupons" ON public.course_coupons
    FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage coupons" ON public.course_coupons
    FOR ALL USING (auth.role() = 'service_role');

-- 15. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 16. INSERT SAMPLE CATEGORIES
-- =============================================

INSERT INTO public.course_categories (name, slug, description, icon, color) VALUES
('Programming', 'programming', 'Learn programming languages and software development', 'code', '#3B82F6'),
('Data Science', 'data-science', 'Master data analysis, machine learning, and AI', 'chart-bar', '#10B981'),
('Business', 'business', 'Develop business and entrepreneurship skills', 'briefcase', '#F59E0B'),
('Design', 'design', 'Creative design and user experience courses', 'palette', '#EF4444'),
('Marketing', 'marketing', 'Digital marketing and growth strategies', 'megaphone', '#8B5CF6'),
('Language', 'language', 'Learn new languages and improve communication', 'globe', '#06B6D4'),
('Test Prep', 'test-prep', 'Prepare for standardized tests and certifications', 'academic-cap', '#84CC16'),
('Academic', 'academic', 'Academic subjects and university preparation', 'book-open', '#6366F1');

-- Success message
SELECT 'Enhanced course system database schema created successfully!' as message; 