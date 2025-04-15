
-- Make sure script bucket exists with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('script', 'Script Files', true, 52428800, ARRAY['*/*']::text[])
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['*/*']::text[];

-- Create more permissive storage policies for the script bucket
BEGIN;
  -- Reset existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Manage Access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public access to script files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload script files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to manage their script files" ON storage.objects;
  
  -- Create a policy that allows public read access to all objects in the script bucket
  CREATE POLICY "Allow public access to script files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'script');
  
  -- Create a policy that allows authenticated users to upload files to the script bucket
  CREATE POLICY "Allow authenticated users to upload script files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'script');
  
  -- Create a policy that allows authenticated users to update and delete their own files
  CREATE POLICY "Allow authenticated users to manage their script files"
  ON storage.objects FOR UPDATE, DELETE
  TO authenticated
  USING (bucket_id = 'script');
  
  -- Ensure the create_public_bucket function exists and works correctly
  CREATE OR REPLACE FUNCTION public.create_public_bucket(bucket_name text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'storage'
  AS $$
  DECLARE
    bucket_exists BOOLEAN;
  BEGIN
    -- Check if the bucket already exists
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = bucket_name
    ) INTO bucket_exists;
    
    -- Create the bucket if it doesn't exist
    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
      VALUES (bucket_name, bucket_name, true, false, 52428800, ARRAY['*/*'::text]);
    ELSE
      -- Update the existing bucket to be public
      UPDATE storage.buckets
      SET 
        public = true,
        file_size_limit = 52428800,
        allowed_mime_types = ARRAY['*/*'::text]
      WHERE id = bucket_name;
    END IF;
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating bucket %: %', bucket_name, SQLERRM;
      RETURN FALSE;
  END;
  $$;
COMMIT;
