
-- Ensure the remot-script bucket exists with public access and all MIME types allowed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('remot-script', 'Remote Script Files', true, 52428800, ARRAY['text/x-lua', 'text/plain']::text[])
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['text/x-lua', 'text/plain']::text[];

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Remote Script Files - Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Remote Script Files - Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Remote Script Files - Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Remote Script Files - Authenticated Delete" ON storage.objects;

-- Create very permissive policies for this bucket - allows anyone to see files,
-- and allows authenticated users (including dashboard users) to upload, update, delete files
CREATE POLICY "Remote Script Files - Public Access" 
ON storage.objects FOR SELECT
USING (bucket_id = 'remot-script');

CREATE POLICY "Remote Script Files - Authenticated Upload" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'remot-script');

CREATE POLICY "Remote Script Files - Authenticated Update" 
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'remot-script');

CREATE POLICY "Remote Script Files - Authenticated Delete" 
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'remot-script');

-- Create a special policy specifically for dashboard access
CREATE POLICY "Admin Access to remot-script" 
ON storage.objects
USING (bucket_id = 'remot-script');
