-- Fix Security Definer issues by dropping dependent objects with CASCADE and recreating safely

-- Drop the security definer functions with CASCADE to remove dependent views
DROP FUNCTION IF EXISTS public.can_access_masked_driver_data() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_full_driver_data() CASCADE;

-- Recreate the operator view with direct role checking (no SECURITY DEFINER)
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
  AND get_current_user_role() IN ('operator', 'admin');

-- Recreate the secure view with direct role checking (no SECURITY DEFINER)
CREATE VIEW public.drivers_secure_view AS
SELECT *
FROM public.drivers
WHERE get_current_user_role() = 'admin';

-- Grant permissions to authenticated users
GRANT SELECT ON public.drivers_operator_view TO authenticated;
GRANT SELECT ON public.drivers_secure_view TO authenticated;

-- Add comprehensive security documentation
COMMENT ON TABLE public.drivers IS 'Contains sensitive driver personal data. Direct access restricted to admins only via RLS policy. Operators must use drivers_operator_view for masked data.';
COMMENT ON VIEW public.drivers_operator_view IS 'Provides masked driver data for operators and admins. CPF, CNH, and phone numbers are masked for privacy. Security enforced through role-based WHERE clause and underlying table RLS policies.';
COMMENT ON VIEW public.drivers_secure_view IS 'Provides full unmasked driver data for administrators only. Contains sensitive personal information including full CPF, CNH, phone, email, and address. Security enforced through admin-only WHERE clause and underlying table RLS policies.';