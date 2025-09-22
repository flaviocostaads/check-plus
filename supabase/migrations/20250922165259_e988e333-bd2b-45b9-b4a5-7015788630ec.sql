-- Fix driver views security by implementing proper access control
-- Views cannot have RLS policies, so we need to recreate them with security definer functions

-- First, drop existing views
DROP VIEW IF EXISTS public.drivers_operator_view;
DROP VIEW IF EXISTS public.drivers_secure_view;

-- Create security definer function for operator access to masked data
CREATE OR REPLACE FUNCTION public.get_drivers_operator_view()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  cpf_masked text,
  cnh_numero_masked text,
  cnh_validade text,
  telefone_masked text,
  avatar_url text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  -- Check if user has operator or admin role
  IF get_current_user_role() NOT IN ('operator', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado para visualizar dados de motoristas';
  END IF;

  -- Log access for audit
  PERFORM log_sensitive_access('drivers_operator_view', NULL, 'OPERATOR_VIEW_ACCESS');

  -- Return masked driver data
  RETURN QUERY
  SELECT 
    d.id,
    d.nome_completo,
    CASE 
      WHEN LENGTH(d.cpf) >= 11 THEN 
        SUBSTRING(d.cpf FROM 1 FOR 3) || '.***.***-**'
      ELSE '***.***.***-**'
    END as cpf_masked,
    CASE 
      WHEN LENGTH(d.cnh_numero) >= 8 THEN 
        SUBSTRING(d.cnh_numero FROM 1 FOR 3) || '********'
      ELSE '***********'
    END as cnh_numero_masked,
    d.cnh_validade,
    CASE 
      WHEN d.telefone IS NOT NULL AND LENGTH(d.telefone) >= 8 THEN 
        SUBSTRING(d.telefone FROM 1 FOR 2) || '*****-****'
      ELSE NULL
    END as telefone_masked,
    d.avatar_url,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM public.drivers d
  WHERE d.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function for admin access to full data
CREATE OR REPLACE FUNCTION public.get_drivers_secure_view()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  cpf text,
  cnh_numero text,
  cnh_validade text,
  telefone text,
  email text,
  endereco text,
  avatar_url text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  -- Check if user has admin role
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar dados completos de motoristas';
  END IF;

  -- Log access for audit
  PERFORM log_sensitive_access('drivers_secure_view', NULL, 'ADMIN_VIEW_ACCESS');

  -- Return full driver data
  RETURN QUERY
  SELECT 
    d.id,
    d.nome_completo,
    d.cpf,
    d.cnh_numero,
    d.cnh_validade,
    d.telefone,
    d.email,
    d.endereco,
    d.avatar_url,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM public.drivers d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate views as simple wrappers around security functions
CREATE VIEW public.drivers_operator_view AS 
SELECT * FROM public.get_drivers_operator_view();

CREATE VIEW public.drivers_secure_view AS 
SELECT * FROM public.get_drivers_secure_view();