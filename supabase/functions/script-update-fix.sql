
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
  ) RETURNING id INTO v_license_id;
  
  RETURN QUERY 
  SELECT 
    v_license_id AS id, 
    v_license_key AS license_key, 
    v_server_key AS server_key;
END;
$$;
