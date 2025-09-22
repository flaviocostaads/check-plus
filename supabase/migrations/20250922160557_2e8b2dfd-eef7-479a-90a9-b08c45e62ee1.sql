-- Fix Security Definer issues by removing SECURITY DEFINER and implementing safer access control

-- Drop the security definer functions that were flagged
DROP FUNCTION IF EXISTS public.can_access_masked_driver_data();
DROP FUNCTION IF EXISTS public.can_access_full_driver_data();

-- Recreate the operator view with direct role checking (no SECURITY DEFINER)
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
  AND get_current_user_role() IN ('operator', 'admin');

-- Recreate the secure view with direct role checking (no SECURITY DEFINER)
DROP VIEW IF EXISTS public.drivers_secure_view;
CREATE VIEW public.drivers_secure_view AS
SELECT *
FROM public.drivers
WHERE get_current_user_role() = 'admin';

-- The security is now enforced through:
-- 1. The drivers table RLS policy (only admins can access directly)
-- 2. The view WHERE clauses that filter based on user role
-- 3. The existing get_current_user_role() function (which uses SECURITY DEFINER but is needed for RLS)

-- Grant permissions
GRANT SELECT ON public.drivers_operator_view TO authenticated;
GRANT SELECT ON public.drivers_secure_view TO authenticated;

-- Update documentation
COMMENT ON VIEW public.drivers_operator_view IS 'Masked driver data view for operators and admins. Security enforced through role-based WHERE clause and underlying table RLS.';
COMMENT ON VIEW public.drivers_secure_view IS 'Full driver data view for admins only. Security enforced through role-based WHERE clause and underlying table RLS.';