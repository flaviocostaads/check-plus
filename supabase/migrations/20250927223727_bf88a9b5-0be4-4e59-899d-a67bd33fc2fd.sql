-- Fix security linter warnings

-- Fix search_path for all functions that don't have it set
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_role user_role)
RETURNS TABLE(can_create_users boolean, can_delete_users boolean, can_view_all_inspections boolean, can_edit_all_inspections boolean, can_manage_vehicles boolean, can_manage_drivers boolean, can_access_reports boolean, can_manage_settings boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.can_create_users,
    p.can_delete_users,
    p.can_view_all_inspections,
    p.can_edit_all_inspections,
    p.can_manage_vehicles,
    p.can_manage_drivers,
    p.can_access_reports,
    p.can_manage_settings
  FROM public.user_role_permissions p
  WHERE p.role = user_role;
$$;

CREATE OR REPLACE FUNCTION public.get_drivers_basic_info()
RETURNS TABLE(id uuid, nome_completo text, avatar_url text, is_active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.nome_completo,
    d.avatar_url,
    d.is_active
  FROM drivers d
  WHERE d.is_active = true
  ORDER BY d.nome_completo;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_inspections bigint, active_vehicles bigint, active_drivers bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get stats for dashboard
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM inspections)::bigint as total_inspections,
    (SELECT COUNT(*) FROM vehicles)::bigint as active_vehicles,
    (SELECT COUNT(*) FROM drivers WHERE is_active = true)::bigint as active_drivers;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_settings()
RETURNS TABLE(id uuid, company_name text, company_logo_url text, company_address text, company_phone text, company_email text, primary_color text, secondary_color text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXTRACT(hour FROM now() AT TIME ZONE 'America/Sao_Paulo') BETWEEN 6 AND 20
  AND EXTRACT(dow FROM now() AT TIME ZONE 'America/Sao_Paulo') BETWEEN 1 AND 5;
$$;