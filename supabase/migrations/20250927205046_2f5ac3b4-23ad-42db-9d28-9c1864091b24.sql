-- Fix company_settings table permissions
-- Create secure function to access company settings
CREATE OR REPLACE FUNCTION public.get_company_settings()
RETURNS TABLE(
  id uuid,
  company_name text,
  company_logo_url text,
  company_address text,
  company_phone text,
  company_email text,
  primary_color text,
  secondary_color text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only authenticated users can access company settings
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  RETURN QUERY
  SELECT 
    cs.id,
    cs.company_name,
    cs.company_logo_url,
    cs.company_address,
    cs.company_phone,
    cs.company_email,
    cs.primary_color,
    cs.secondary_color,
    cs.created_at,
    cs.updated_at
  FROM company_settings cs
  LIMIT 1;
END;
$$;

-- Create secure function to save company settings
CREATE OR REPLACE FUNCTION public.save_company_settings(
  p_company_name text,
  p_company_logo_url text DEFAULT NULL,
  p_company_address text DEFAULT NULL,
  p_company_phone text DEFAULT NULL,
  p_company_email text DEFAULT NULL,
  p_primary_color text DEFAULT '#3b82f6',
  p_secondary_color text DEFAULT '#64748b'
)
RETURNS TABLE(
  id uuid,
  company_name text,
  company_logo_url text,
  company_address text,
  company_phone text,
  company_email text,
  primary_color text,
  secondary_color text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_settings company_settings;
  result_record company_settings;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  -- Check if settings already exist
  SELECT * INTO existing_settings FROM company_settings LIMIT 1;

  IF existing_settings.id IS NOT NULL THEN
    -- Update existing settings
    UPDATE company_settings SET
      company_name = p_company_name,
      company_logo_url = COALESCE(p_company_logo_url, company_logo_url),
      company_address = p_company_address,
      company_phone = p_company_phone,
      company_email = p_company_email,
      primary_color = p_primary_color,
      secondary_color = p_secondary_color,
      updated_at = now()
    WHERE id = existing_settings.id
    RETURNING * INTO result_record;
  ELSE
    -- Insert new settings
    INSERT INTO company_settings (
      company_name,
      company_logo_url,
      company_address,
      company_phone,
      company_email,
      primary_color,
      secondary_color
    ) VALUES (
      p_company_name,
      p_company_logo_url,
      p_company_address,
      p_company_phone,
      p_company_email,
      p_primary_color,
      p_secondary_color
    )
    RETURNING * INTO result_record;
  END IF;

  RETURN QUERY
  SELECT 
    result_record.id,
    result_record.company_name,
    result_record.company_logo_url,
    result_record.company_address,
    result_record.company_phone,
    result_record.company_email,
    result_record.primary_color,
    result_record.secondary_color,
    result_record.created_at,
    result_record.updated_at;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_company_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_company_settings(text, text, text, text, text, text, text) TO authenticated;