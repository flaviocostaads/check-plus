-- Fix Security Definer views by removing the SECURITY DEFINER property
-- These views should use the invoker's permissions, not elevated privileges

-- Drop and recreate drivers_operator_view without SECURITY DEFINER
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
WHERE is_active = true;

-- Drop and recreate drivers_secure_view without SECURITY DEFINER  
DROP VIEW IF EXISTS public.drivers_secure_view;

CREATE VIEW public.drivers_secure_view AS
SELECT *
FROM public.drivers;

-- Add RLS policies for the views
ALTER VIEW public.drivers_operator_view SET (security_invoker = on);
ALTER VIEW public.drivers_secure_view SET (security_invoker = on);

-- Grant appropriate permissions
GRANT SELECT ON public.drivers_operator_view TO authenticated;
GRANT SELECT ON public.drivers_secure_view TO authenticated;