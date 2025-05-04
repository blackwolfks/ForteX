
-- Aktualisiere die create_license Funktion, um mehrdeutige ID-Referenzen zu beheben
CREATE OR REPLACE FUNCTION public.create_license(
  p_script_name text,
  p_script_file text DEFAULT NULL,
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
  -- Generiere einen eindeutigen Schlüssel
  LOOP
    v_license_key := public.generate_license_key();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.server_licenses AS sl 
      WHERE sl.license_key = v_license_key
    );
  END LOOP;
  
  -- Generiere einen Server-Key
  v_server_key := substring(md5(random()::text) from 1 for 12);
  
  -- Erstelle den Lizenzeintrag
  INSERT INTO public.server_licenses (
    license_key,
    user_id,
    script_name,
    script_file,
    server_ip,
    server_key
  ) VALUES (
    v_license_key,
    auth.uid(),
    p_script_name,
    p_script_file,
    p_server_ip,
    v_server_key
  ) RETURNING public.server_licenses.id INTO v_license_id;
  
  RETURN QUERY 
  SELECT 
    v_license_id AS id, 
    v_license_key AS license_key, 
    v_server_key AS server_key;
END;
$$;

-- Stelle sicher, dass die check_license_by_keys Funktion ebenfalls korrekte Spaltennamen verwendet
DROP FUNCTION IF EXISTS public.check_license_by_keys(text, text);
CREATE OR REPLACE FUNCTION public.check_license_by_keys(
  p_license_key text, 
  p_server_key text
)
RETURNS TABLE(
  valid boolean,
  license_key text,
  script_name text,
  script_file text,
  server_ip text,
  aktiv boolean,
  id uuid,
  has_file_upload boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as valid,
    sl.license_key,
    sl.script_name,
    sl.script_file,
    sl.server_ip,
    sl.aktiv,
    sl.id,
    sl.has_file_upload
  FROM public.server_licenses sl
  WHERE sl.license_key = p_license_key 
    AND sl.server_key = p_server_key
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE as valid,
      NULL::TEXT as license_key,
      NULL::TEXT as script_name,
      NULL::TEXT as script_file,
      NULL::TEXT as server_ip,
      FALSE as aktiv,
      NULL::UUID as id,
      FALSE as has_file_upload;
  END IF;
END;
$$;

-- Fix: Update the get_script_logs function to better handle the null license_id parameter
CREATE OR REPLACE FUNCTION public.get_script_logs(
  p_license_id uuid DEFAULT NULL, 
  p_level text DEFAULT NULL, 
  p_source text DEFAULT NULL, 
  p_search text DEFAULT NULL, 
  p_start_date timestamp with time zone DEFAULT NULL, 
  p_end_date timestamp with time zone DEFAULT NULL, 
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  id uuid, 
  license_id uuid, 
  log_timestamp timestamp with time zone, 
  level text, 
  message text, 
  source text, 
  details text, 
  error_code text, 
  client_ip text, 
  file_name text, 
  script_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id,
    sl.license_id,
    sl.log_timestamp,
    sl.level,
    sl.message,
    sl.source,
    sl.details,
    sl.error_code,
    sl.client_ip,
    sl.file_name,
    l.script_name
  FROM 
    public.script_logs sl
  JOIN
    public.server_licenses l ON sl.license_id = l.id
  WHERE 
    EXISTS (
      SELECT 1 FROM public.server_licenses lic 
      WHERE sl.license_id = lic.id AND lic.user_id = auth.uid()
    )
    AND (p_license_id IS NULL OR sl.license_id = p_license_id)
    AND (p_level IS NULL OR sl.level = p_level)
    AND (p_source IS NULL OR sl.source = p_source)
    AND (
      p_search IS NULL 
      OR sl.message ILIKE '%' || p_search || '%' 
      OR COALESCE(sl.details, '') ILIKE '%' || p_search || '%'
      OR COALESCE(sl.error_code, '') ILIKE '%' || p_search || '%'
      OR COALESCE(sl.file_name, '') ILIKE '%' || p_search || '%'
    )
    AND (p_start_date IS NULL OR sl.log_timestamp >= p_start_date)
    AND (p_end_date IS NULL OR sl.log_timestamp <= p_end_date)
  ORDER BY 
    sl.log_timestamp DESC
  LIMIT p_limit;
END;
$$;
