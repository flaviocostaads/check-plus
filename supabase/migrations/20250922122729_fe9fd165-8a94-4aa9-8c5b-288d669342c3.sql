-- Fix Security Definer View Issue
-- Replace the problematic view with a regular view that uses RLS policies

DROP VIEW IF EXISTS public.drivers_secure_view;

-- Create a regular view without SECURITY DEFINER (relies on RLS policies instead)
CREATE VIEW public.drivers_secure_view AS
SELECT 
  id,
  nome_completo,
  cpf,
  telefone,
  endereco,
  email,
  cnh_numero,
  cnh_validade,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.drivers;

-- Grant access to the view
GRANT SELECT ON public.drivers_secure_view TO authenticated;