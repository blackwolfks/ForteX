
-- Create a function to safely create a storage bucket with public access
CREATE OR REPLACE FUNCTION public.create_public_bucket(bucket_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
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
  
  -- Create policies for the bucket with permanent naming
  -- This way they won't conflict with other policies and will persist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public ' || bucket_name || ' Access (Permanent)'
  ) THEN
    EXECUTE format('
      CREATE POLICY "Public %I Access (Permanent)" 
      ON storage.objects FOR ALL 
      USING (bucket_id = %L) 
      WITH CHECK (bucket_id = %L)', 
      bucket_name, bucket_name, bucket_name
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating bucket %: %', bucket_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Ensure script bucket exists and is public
SELECT public.create_public_bucket('script');

-- Create policies for the script bucket with permanent naming
DO $$
BEGIN
  -- Read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Read script Bucket (Permanent)'
  ) THEN
    CREATE POLICY "Public Read script Bucket (Permanent)"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'script');
  END IF;

  -- Insert policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated Users can Upload to script Bucket (Permanent)'
  ) THEN
    CREATE POLICY "Authenticated Users can Upload to script Bucket (Permanent)"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'script');
  END IF;

  -- Update policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated Users can Update script Bucket (Permanent)'
  ) THEN
    CREATE POLICY "Authenticated Users can Update script Bucket (Permanent)"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'script');
  END IF;

  -- Delete policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated Users can Delete from script Bucket (Permanent)'
  ) THEN
    CREATE POLICY "Authenticated Users can Delete from script Bucket (Permanent)"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'script');
  END IF;
END $$;
