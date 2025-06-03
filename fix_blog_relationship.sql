-- Fix the relationship between blogs and profiles tables

-- First, let's check if there are any existing blogs with invalid author_ids
SELECT b.id, b.author_id, p.id as profile_id 
FROM public.blogs b 
LEFT JOIN public.profiles p ON b.author_id = p.id 
WHERE p.id IS NULL;

-- Delete any blogs with invalid author_ids
DELETE FROM public.blogs 
WHERE author_id NOT IN (SELECT id FROM public.profiles);

-- Drop and recreate the foreign key constraint
ALTER TABLE public.blogs DROP CONSTRAINT IF EXISTS blogs_author_id_fkey;

-- Add the foreign key constraint back
ALTER TABLE public.blogs 
ADD CONSTRAINT blogs_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Verify the constraint exists
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='blogs'; 