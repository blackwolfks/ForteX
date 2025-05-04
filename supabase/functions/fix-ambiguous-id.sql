
-- 1. Update the add_script_log function to use a single parameter signature
CREATE OR REPLACE FUNCTION public.add_script_log(
  p_license_id uuid, 
  p_level text, 
  p_message text, 
  p_source text DEFAULT NULL::text, 
  p_details text DEFAULT NULL::text, 
  p_error_code text DEFAULT NULL::text, 
  p_client_ip text DEFAULT NULL::text, 
  p_file_name text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify license exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.server_licenses 
    WHERE id = p_license_id AND aktiv = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive license';
  END IF;
  
  -- Insert the log
  INSERT INTO public.script_logs (
    license_id,
    level,
    message,
    source,
    details,
    error_code,
    client_ip,
    file_name
  ) VALUES (
    p_license_id,
    p_level,
    p_message,
    p_source,
    p_details,
    p_error_code,
    p_client_ip,
    p_file_name
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Remove the overloaded version with user_id parameter if it exists
DROP FUNCTION IF EXISTS public.add_script_log(uuid, text, text, text, text, text, text, text, uuid);

-- 2. Check if user_id column exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'script_logs'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.script_logs DROP COLUMN user_id;
  END IF;
END;
$$;
