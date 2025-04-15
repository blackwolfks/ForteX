
-- Create storage bucket for scripts if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('script', 'Script Files', true, 10485760, array['text/x-lua', 'text/plain']::text[])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['text/x-lua', 'text/plain']::text[];

-- Create storage policy to allow users to upload their own files
BEGIN;
-- Only drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to upload their license files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to download any script file" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their license files for update" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their license files for delete" ON storage.objects;

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

-- Create policy for updating files - authenticated users can update their own files
CREATE POLICY "Allow users to manage their license files for update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'script'
);

-- Create policy for deleting files - authenticated users can delete their own files
CREATE POLICY "Allow users to manage their license files for delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'script'
);
COMMIT;
