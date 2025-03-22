
-- Create storage bucket for scripts if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('script', 'Script Files', true, 10485760, '{text/plain,application/octet-stream}')
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = '{text/plain,application/octet-stream}';

-- Create storage policy to allow users to upload their own files
BEGIN;
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow users to upload their license files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to download any script file" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their license files" ON storage.objects;

-- Create policy for uploading files - restricted to script bucket and user-specific paths
CREATE POLICY "Allow users to upload their license files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'script' AND 
  (auth.uid())::text = SPLIT_PART(name, '/', 1)
);

-- Create policy for viewing files - public access to enable FiveM scripts to download them
CREATE POLICY "Allow public to download any script file"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'script'
);

-- Create policy for managing files
CREATE POLICY "Allow users to manage their license files"
ON storage.objects
FOR UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'script' AND 
  (auth.uid())::text = SPLIT_PART(name, '/', 1)
);
COMMIT;
