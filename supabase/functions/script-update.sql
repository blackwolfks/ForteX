
-- Füge die Server-IP-Spalte zur server_licenses Tabelle hinzu
ALTER TABLE public.server_licenses 
ADD COLUMN IF NOT EXISTS server_ip TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_file_upload BOOLEAN DEFAULT FALSE;

-- Aktualisiere die update_license Funktion, um die neue Spalte zu unterstützen
CREATE OR REPLACE FUNCTION public.update_license(
  p_license_id uuid, 
  p_script_name text DEFAULT NULL,
  p_script_file text DEFAULT NULL,
  p_server_ip text DEFAULT NULL,
  p_aktiv boolean DEFAULT NULL,
  p_has_file_upload boolean DEFAULT NULL,
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
  -- Wenn der Server-Key neu generiert werden soll
  IF p_regenerate_server_key THEN
    v_new_server_key := substring(md5(random()::text) from 1 for 12);
  END IF;
  
  -- Aktualisiere die Lizenz
  UPDATE public.server_licenses
  SET 
    script_name = COALESCE(p_script_name, script_name),
    script_file = COALESCE(p_script_file, script_file),
    server_ip = COALESCE(p_server_ip, server_ip),
    aktiv = COALESCE(p_aktiv, aktiv),
    has_file_upload = COALESCE(p_has_file_upload, has_file_upload),
    server_key = COALESCE(v_new_server_key, server_key),
    updated_at = now()
  WHERE id = p_license_id AND user_id = auth.uid();
  
  v_success := FOUND;
  
  -- Wenn der Server-Key neu generiert wurde oder die Aktualisierung erfolgreich war
  IF v_success THEN
    SELECT COALESCE(v_new_server_key, server_key) INTO v_new_server_key
    FROM public.server_licenses
    WHERE id = p_license_id AND user_id = auth.uid();
  END IF;
  
  RETURN QUERY SELECT v_success, v_new_server_key;
END;
$$;

-- Aktualisiere die create_license Funktion, um die neue Spalte zu unterstützen
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
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.server_licenses WHERE license_key = v_license_key);
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
  
  RETURN QUERY SELECT v_license_id, v_license_key, v_server_key;
END;
$$;

-- Aktualisiere die check_license_by_server_key Funktion
CREATE OR REPLACE FUNCTION public.check_license_by_server_key(
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
    license_key,
    script_name,
    script_file,
    server_ip,
    aktiv,
    id,
    has_file_upload
  FROM public.server_licenses
  WHERE server_key = p_server_key
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

-- Aktualisiere die check_license_by_server_key Funktion weiter
CREATE OR REPLACE FUNCTION public.check_license_by_server_key(
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

-- Erstelle einen Storage-Bucket für Skript-Dateien
INSERT INTO storage.buckets (id, name, public) 
VALUES ('script-files', 'Script Files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies für den Storage-Bucket
BEGIN;
  -- Policy für authentifizierte Benutzer zum Hochladen
  DROP POLICY IF EXISTS "Authentifizierte Benutzer können Dateien hochladen" ON storage.objects;
  CREATE POLICY "Authentifizierte Benutzer können Dateien hochladen"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'script-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

  -- Policy für authentifizierte Benutzer zum Lesen ihrer eigenen Dateien
  DROP POLICY IF EXISTS "Authentifizierte Benutzer können ihre eigenen Dateien lesen" ON storage.objects;
  CREATE POLICY "Authentifizierte Benutzer können ihre eigenen Dateien lesen"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'script-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

  -- Policy für authentifizierte Benutzer zum Aktualisieren ihrer eigenen Dateien
  DROP POLICY IF EXISTS "Authentifizierte Benutzer können ihre eigenen Dateien aktualisieren" ON storage.objects;
  CREATE POLICY "Authentifizierte Benutzer können ihre eigenen Dateien aktualisieren"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'script-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

  -- Policy für authentifizierte Benutzer zum Löschen ihrer eigenen Dateien
  DROP POLICY IF EXISTS "Authentifizierte Benutzer können ihre eigenen Dateien löschen" ON storage.objects;
  CREATE POLICY "Authentifizierte Benutzer können ihre eigenen Dateien löschen"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'script-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
COMMIT;
