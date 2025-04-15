
-- Make sure script bucket exists with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('script', 'Script Files', true, 52428800, ARRAY['text/x-lua', 'text/plain']::text[])
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['text/x-lua', 'text/plain']::text[];

-- Create more permissive storage policies for the script bucket
BEGIN;
  -- Reset existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Manage Access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public access to script files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload script files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to manage their script files" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read script Bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users can Upload to script Bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users can Update script Bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users can Delete from script Bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to upload their license files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public to download any script file" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to manage their license files" ON storage.objects;
  
  -- Create simple, permissive policies with unique names
  
  -- Public read access to all objects in the script bucket
  CREATE POLICY "Public script Access (Permanent)"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'script');
  
  -- Authenticated users can upload to the script bucket
  CREATE POLICY "Upload to script Bucket (Permanent)"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'script');
  
  -- Authenticated users can update files in the script bucket
  CREATE POLICY "Update script Files (Permanent)"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'script');
  
  -- Authenticated users can delete files in the script bucket
  CREATE POLICY "Delete from script Bucket (Permanent)"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'script');
  
  -- Ensure the create_public_bucket function exists
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
      VALUES (bucket_name, bucket_name, true, false, 52428800, ARRAY['text/x-lua', 'text/plain']::text);
    ELSE
      -- Update the existing bucket to be public and allow only Lua files
      UPDATE storage.buckets
      SET 
        public = true,
        file_size_limit = 52428800,
        allowed_mime_types = ARRAY['text/x-lua', 'text/plain']::text
      WHERE id = bucket_name;
    END IF;
    
    -- Create permissive policies for this bucket that won't be dropped
    EXECUTE format('
      DROP POLICY IF EXISTS "Public %I Access (Permanent)" ON storage.objects;
      CREATE POLICY "Public %I Access (Permanent)" ON storage.objects FOR SELECT USING (bucket_id = %L);
      
      DROP POLICY IF EXISTS "Upload to %I (Permanent)" ON storage.objects;
      CREATE POLICY "Upload to %I (Permanent)" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L);
      
      DROP POLICY IF EXISTS "Update %I (Permanent)" ON storage.objects;
      CREATE POLICY "Update %I (Permanent)" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L);
      
      DROP POLICY IF EXISTS "Delete from %I (Permanent)" ON storage.objects;
      CREATE POLICY "Delete from %I (Permanent)" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L);
    ', 
      bucket_name, bucket_name, bucket_name,
      bucket_name, bucket_name, bucket_name,
      bucket_name, bucket_name, bucket_name,
      bucket_name, bucket_name, bucket_name
    );
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating bucket %: %', bucket_name, SQLERRM;
      RETURN FALSE;
  END;
  $$;
COMMIT;
