-- =============================================
-- SIMPLE BUCKET CREATION FOR UNIVERSITY IMAGES
-- Copy and paste this into your Supabase SQL Editor
-- =============================================

-- 1. Create the public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'university-images',
  'university-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
);

-- 2. Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'university-images');

-- 3. Allow authenticated users to upload
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to update
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- 5. Allow authenticated users to delete
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE name = 'university-images'; 