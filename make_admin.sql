-- =============================================
-- MAKE MATRIXAI.GLOBAL ADMIN AND CREATE TABLES
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Update matrixai.global@gmail.com to be admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'matrixai.global@gmail.com';

-- 2. Create blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create scholarships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scholarships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2),
    eligibility TEXT,
    deadline DATE,
    university TEXT,
    country TEXT,
    application_link TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on both tables
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for blogs table
DROP POLICY IF EXISTS "Anyone can view blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;

CREATE POLICY "Anyone can view blogs" ON public.blogs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage blogs" ON public.blogs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. Create RLS policies for scholarships table
DROP POLICY IF EXISTS "Anyone can view scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;

CREATE POLICY "Anyone can view scholarships" ON public.scholarships
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage scholarships" ON public.scholarships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 7. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON public.blogs 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scholarships_updated_at ON public.scholarships;
CREATE TRIGGER update_scholarships_updated_at 
    BEFORE UPDATE ON public.scholarships 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at);

CREATE INDEX IF NOT EXISTS idx_scholarships_created_by ON public.scholarships(created_by);
CREATE INDEX IF NOT EXISTS idx_scholarships_country ON public.scholarships(country);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON public.scholarships(deadline);

-- 9. Grant permissions
GRANT ALL ON public.blogs TO anon, authenticated, service_role;
GRANT ALL ON public.scholarships TO anon, authenticated, service_role;

-- 10. Verify admin status
SELECT email, role FROM public.profiles WHERE email = 'matrixai.global@gmail.com';

-- =============================================
-- SETUP COMPLETE
-- ============================================= 