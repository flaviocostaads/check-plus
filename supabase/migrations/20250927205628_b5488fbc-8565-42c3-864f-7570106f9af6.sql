-- Fix the ambiguous column reference error in save_company_settings function
CREATE OR REPLACE FUNCTION public.save_company_settings(
  p_company_name text,
  p_company_logo_url text DEFAULT NULL::text,
  p_company_address text DEFAULT NULL::text,
  p_company_phone text DEFAULT NULL::text,
  p_company_email text DEFAULT NULL::text,
  p_primary_color text DEFAULT '#3b82f6'::text,
  p_secondary_color text DEFAULT '#64748b'::text
) RETURNS TABLE(
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
SET search_path = public
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
      company_logo_url = COALESCE(p_company_logo_url, company_settings.company_logo_url),
      company_address = p_company_address,
      company_phone = p_company_phone,
      company_email = p_company_email,
      primary_color = p_primary_color,
      secondary_color = p_secondary_color,
      updated_at = now()
    WHERE company_settings.id = existing_settings.id
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.save_company_settings(text, text, text, text, text, text, text) TO authenticated;