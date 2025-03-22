
-- This file creates a backward compatibility function to handle
-- the script_files table references in the code

-- Create a helper view for backward compatibility with the code that's referencing script_files
CREATE OR REPLACE VIEW public.script_files AS
SELECT * FROM public.server_licenses;

-- Update the existing get_user_licenses function to use the server_licenses table
CREATE OR REPLACE FUNCTION public.get_user_licenses()
RETURNS TABLE(id uuid, license_key text, server_key text, script_name text, script_file text, aktiv boolean, created_at timestamp with time zone, server_ip text, has_file_upload boolean, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    id, 
    license_key, 
    server_key, 
    script_name, 
    script_file, 
    aktiv, 
    created_at,
    server_ip,
    has_file_upload,
    updated_at
  FROM public.server_licenses
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$function$;

-- Make sure the update_license function exists and has the correct parameters
CREATE OR REPLACE FUNCTION public.update_license(
  p_license_id uuid, 
  p_script_name text DEFAULT NULL::text, 
  p_script_file text DEFAULT NULL::text, 
  p_aktiv boolean DEFAULT NULL::boolean, 
  p_regenerate_server_key boolean DEFAULT false, 
  p_server_ip text DEFAULT NULL::text, 
  p_has_file_upload boolean DEFAULT NULL::boolean
)
RETURNS TABLE(success boolean, server_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_server_key TEXT;
  v_success BOOLEAN;
BEGIN
  -- If the server key should be regenerated
  IF p_regenerate_server_key THEN
    v_new_server_key := substring(md5(random()::text) from 1 for 12);
  END IF;
  
  -- Update the license with explicit table references
  UPDATE public.server_licenses sl
  SET 
    script_name = COALESCE(p_script_name, sl.script_name),
    script_file = COALESCE(p_script_file, sl.script_file),
    server_ip = COALESCE(p_server_ip, sl.server_ip),
    aktiv = COALESCE(p_aktiv, sl.aktiv),
    has_file_upload = COALESCE(p_has_file_upload, sl.has_file_upload),
    server_key = COALESCE(v_new_server_key, sl.server_key),
    updated_at = now()
  WHERE sl.id = p_license_id AND sl.user_id = auth.uid();
  
  v_success := FOUND;
  
  -- If the server key was regenerated or the update was successful
  IF v_success THEN
    SELECT COALESCE(v_new_server_key, sl.server_key) INTO v_new_server_key
    FROM public.server_licenses sl
    WHERE sl.id = p_license_id AND sl.user_id = auth.uid();
  END IF;
  
  RETURN QUERY SELECT v_success, v_new_server_key;
END;
$function$;
