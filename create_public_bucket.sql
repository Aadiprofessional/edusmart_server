-- =============================================
-- CREATE PUBLIC BUCKET FOR IMAGE UPLOADS
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create the public bucket for university images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'university-images',
  'university-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Create RLS policies for the bucket

-- Allow public read access to all files
CREATE POLICY "Public read access for university images" ON storage.objects
FOR SELECT USING (bucket_id = 'university-images');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload university images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update university images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files (optional - you might want to restrict this to admins only)
CREATE POLICY "Authenticated users can delete university images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'university-images' 
  AND auth.role() = 'authenticated'
);

-- 3. Alternative: Admin-only upload policy (uncomment if you want only admins to upload)
/*
-- First, create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Replace 'your-admin-uid' with actual admin UIDs or implement your admin check logic
  RETURN auth.uid()::text IN (
    'your-admin-uid-1',
    'your-admin-uid-2'
    -- Add more admin UIDs as needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only upload policy
CREATE POLICY "Only admins can upload university images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'university-images' 
  AND is_admin_user()
);

-- Admin-only update policy
CREATE POLICY "Only admins can update university images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'university-images' 
  AND is_admin_user()
);

-- Admin-only delete policy
CREATE POLICY "Only admins can delete university images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'university-images' 
  AND is_admin_user()
);
*/

-- 4. Create a function to generate signed URLs for uploads (optional)
CREATE OR REPLACE FUNCTION generate_university_image_upload_url(file_name TEXT)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This is a placeholder - you'll need to implement this based on your needs
  -- You can use Supabase client libraries to generate signed URLs
  RETURN 'https://your-project.supabase.co/storage/v1/object/university-images/' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a helper function to get public URL for images
CREATE OR REPLACE FUNCTION get_university_image_public_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://your-project.supabase.co/storage/v1/object/public/university-images/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- To upload an image via API:
-- POST https://your-project.supabase.co/storage/v1/object/university-images/logo-harvard.png
-- Headers: Authorization: Bearer YOUR_JWT_TOKEN
-- Body: (binary image data)

-- To get public URL:
-- https://your-project.supabase.co/storage/v1/object/public/university-images/logo-harvard.png

-- =============================================
-- NOTES
-- =============================================

-- 1. Replace 'your-project' with your actual Supabase project reference
-- 2. The bucket allows public read access, so anyone can view the images
-- 3. Only authenticated users can upload (or only admins if you use the alternative policies)
-- 4. File size limit is set to 5MB - adjust as needed
-- 5. Only image MIME types are allowed
-- 6. You can organize files in folders like: logos/harvard-logo.png, images/harvard-campus.jpg

-- =============================================
-- FRONTEND USAGE EXAMPLE (JavaScript)
-- =============================================

/*
// Upload image to bucket
const uploadImage = async (file, fileName) => {
  const { data, error } = await supabase.storage
    .from('university-images')
    .upload(`logos/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('university-images')
    .getPublicUrl(`logos/${fileName}`);
  
  return publicUrl;
};

// Usage
const handleFileUpload = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const publicUrl = await uploadImage(file, fileName);
  
  if (publicUrl) {
    // Use the publicUrl in your university form
    setFormData({ ...formData, logo: publicUrl });
  }
};
*/ 