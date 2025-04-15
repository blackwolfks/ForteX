
-- Create storage bucket for scripts if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('script', 'Script Files', true, 10485760, array['text/plain', 'application/octet-stream', '*/*']::text[])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['text/plain', 'application/octet-stream', '*/*']::text[];

-- Create storage policy to allow users to upload their own files
BEGIN;
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow users to upload their license files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to download any script file" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their license files" ON storage.objects;

-- Create policy for uploading files - authenticated users can upload to their folders
CREATE POLICY "Allow users to upload their license files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'script'
);

-- Create policy for viewing files - public access for public files
CREATE POLICY "Allow public to download any script file"
ON storage.objects
FOR SELECT
TO PUBLIC
USING (
  bucket_id = 'script'
);

-- Create policy for managing files - authenticated users can update/delete their own files
CREATE POLICY "Allow users to manage their license files"
ON storage.objects
FOR UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'script'
);
COMMIT;
