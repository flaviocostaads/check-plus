-- Fix critical security vulnerability with proper approach for views
-- Views cannot have RLS policies, so we need to control access through the underlying table and functions

-- First, revoke the overly broad permissions
REVOKE SELECT ON public.drivers_operator_view FROM authenticated;
REVOKE SELECT ON public.drivers_secure_view FROM authenticated;

-- Create a security function that checks if user can access masked driver data
CREATE OR REPLACE FUNCTION public.can_access_masked_driver_data()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT get_current_user_role() IN ('operator', 'admin');
$$;

-- Create a security function that checks if user can access full driver data  
CREATE OR REPLACE FUNCTION public.can_access_full_driver_data()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT get_current_user_role() = 'admin';
$$;

-- Recreate the operator view with built-in security check
DROP VIEW IF EXISTS public.drivers_operator_view;
CREATE VIEW public.drivers_operator_view AS
SELECT 
  id,
  nome_completo,
  -- Mask sensitive data for operators
  CASE 
    WHEN LENGTH(cpf) >= 6 THEN 
      '***.' || SUBSTRING(cpf FROM LENGTH(cpf)-5 FOR 3) || '.' || SUBSTRING(cpf FROM LENGTH(cpf)-2) || '-**'
    ELSE '***.**-**'
  END as cpf_masked,
  -- Mask CNH number (show only last 3 digits)
  CASE 
    WHEN LENGTH(cnh_numero) >= 3 THEN 
      REPEAT('*', LENGTH(cnh_numero)-3) || RIGHT(cnh_numero, 3)
    ELSE '***'
  END as cnh_numero_masked,
  cnh_validade,
  -- Mask phone number
  CASE 
    WHEN telefone IS NOT NULL AND LENGTH(telefone) > 4 THEN 
      '(**) ****-' || RIGHT(REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'), 4)
    ELSE NULL
  END as telefone_masked,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.drivers
WHERE is_active = true 
  AND can_access_masked_driver_data() = true;

-- Recreate the secure view with built-in security check
DROP VIEW IF EXISTS public.drivers_secure_view;
CREATE VIEW public.drivers_secure_view AS
SELECT *
FROM public.drivers
WHERE can_access_full_driver_data() = true;

-- Grant SELECT permissions only to authenticated users (security is handled by the views themselves)
GRANT SELECT ON public.drivers_operator_view TO authenticated;
GRANT SELECT ON public.drivers_secure_view TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.drivers_operator_view IS 'Masked driver data view with built-in role-based access control. Only operators and admins can access this view.';
COMMENT ON VIEW public.drivers_secure_view IS 'Full driver data view with built-in admin-only access control. Contains unmasked sensitive personal information.';