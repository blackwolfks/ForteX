
-- Fix the create_license function by removing script_file references
CREATE OR REPLACE FUNCTION public.create_license(
  p_script_name text,
  p_server_ip text DEFAULT NULL
)
RETURNS TABLE(id uuid, license_key text, server_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_license_key TEXT;
  v_server_key TEXT;
  v_license_id UUID;
BEGIN
  -- Generate a unique key with explicit table reference
  LOOP
    v_license_key := public.generate_license_key();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.server_licenses AS sl 
      WHERE sl.license_key = v_license_key
    );
  END LOOP;
  
  -- Generate a server key
  v_server_key := substring(md5(random()::text) from 1 for 12);
  
  -- Create the license entry with explicit column references
  INSERT INTO public.server_licenses (
    license_key,
    user_id,
    script_name,
    server_ip,
    server_key
  ) VALUES (
    v_license_key,
    auth.uid(),
    p_script_name,
    p_server_ip,
    v_server_key
  ) RETURNING id INTO v_license_id;
  
  -- Return results with explicit column aliasing
  RETURN QUERY 
  SELECT 
    v_license_id AS id, 
    v_license_key AS license_key, 
    v_server_key AS server_key;
END;
$$;

-- Fix the update_license function by removing script_file references
CREATE OR REPLACE FUNCTION public.update_license(
  p_license_id uuid, 
  p_script_name text DEFAULT NULL::text,
  p_server_ip text DEFAULT NULL::text, 
  p_aktiv boolean DEFAULT NULL::boolean, 
  p_has_file_upload boolean DEFAULT NULL::boolean,
  p_regenerate_server_key boolean DEFAULT false
)
RETURNS TABLE(success boolean, server_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix the get_user_licenses function by removing script_file references
CREATE OR REPLACE FUNCTION public.get_user_licenses()
RETURNS TABLE(id uuid, license_key text, server_key text, script_name text, aktiv boolean, created_at timestamp with time zone, server_ip text, has_file_upload boolean, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    id, 
    license_key, 
    server_key, 
    script_name, 
    aktiv, 
    created_at,
    server_ip,
    has_file_upload,
    updated_at
  FROM public.server_licenses
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$function$;

-- Fix the view for backward compatibility
CREATE OR REPLACE VIEW public.script_files AS
SELECT id, license_key, server_key, script_name, server_ip, aktiv, has_file_upload, user_id, created_at, updated_at
FROM public.server_licenses;
