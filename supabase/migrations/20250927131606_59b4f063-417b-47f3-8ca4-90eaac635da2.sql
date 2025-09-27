-- Fix remaining security linter warnings (corrected version)

-- ============================================================================
-- 1. CREATE SECURE FUNCTIONS FOR DRIVER ACCESS (replacing any direct access)
-- ============================================================================

-- Create a secure function for basic driver info access by operators
CREATE OR REPLACE FUNCTION public.get_drivers_basic_info()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  avatar_url text,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has operator or admin role
  IF get_current_user_role() NOT IN ('operator', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado para visualizar dados básicos de motoristas';
  END IF;

  -- Log the access for audit purposes
  PERFORM log_sensitive_access('drivers_basic_info', NULL, 'BASIC_INFO_ACCESS');

  -- Return only basic, non-sensitive driver information
  RETURN QUERY
  SELECT 
    d.id,
    d.nome_completo,
    d.avatar_url,
    d.is_active,
    d.created_at
  FROM public.drivers d
  WHERE d.is_active = true
  ORDER BY d.nome_completo;
END;
$$;

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATH WARNINGS
-- ============================================================================

-- Update the log_driver_data_access function to have proper search_path
CREATE OR REPLACE FUNCTION public.log_driver_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any SELECT operation on drivers table
  IF TG_OP = 'SELECT' THEN
    PERFORM log_sensitive_access('drivers', NULL, 'DIRECT_TABLE_ACCESS');
  END IF;
  
  RETURN NULL; -- For AFTER SELECT triggers
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- 3. CREATE ACCESS VALIDATION FUNCTION
-- ============================================================================

-- Create a function to validate user access before any driver-related operation
CREATE OR REPLACE FUNCTION public.validate_driver_access_permission(operation_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role
  user_role := get_current_user_role();
  
  -- Log the access attempt
  PERFORM log_sensitive_access('driver_access_validation', NULL, operation_type);
  
  -- Define access rules based on operation type and user role
  CASE operation_type
    WHEN 'FULL_ACCESS' THEN
      -- Only admins can have full access to driver data
      RETURN user_role = 'admin';
    WHEN 'BASIC_ACCESS' THEN
      -- Operators and admins can access basic driver info
      RETURN user_role IN ('operator', 'admin');
    WHEN 'SEARCH_ACCESS' THEN
      -- Operators and admins can search drivers for assignment
      RETURN user_role IN ('operator', 'admin');
    ELSE
      -- Unknown operation type - deny access
      RETURN false;
  END CASE;
END;
$$;

-- ============================================================================
-- 4. CREATE ADMIN-ONLY FULL DATA ACCESS FUNCTION
-- ============================================================================

-- Function for admins to get full driver data with audit logging
CREATE OR REPLACE FUNCTION public.get_driver_full_data(driver_id uuid)
RETURNS TABLE(
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
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate admin access
  IF NOT validate_driver_access_permission('FULL_ACCESS') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar dados completos de motoristas';
  END IF;

  -- Log the specific driver access
  PERFORM log_sensitive_access('driver_full_data', driver_id, 'ADMIN_FULL_ACCESS');

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
  FROM public.drivers d
  WHERE d.id = driver_id;
END;
$$;

-- ============================================================================
-- 5. SECURITY VALIDATION FUNCTION
-- ============================================================================

-- Create a function to validate the current security setup
CREATE OR REPLACE FUNCTION public.validate_security_setup()
RETURNS TABLE(check_name text, status text, details text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: Verify RLS is enabled on sensitive tables
  RETURN QUERY
  SELECT 
    'RLS_ENABLED' as check_name,
    CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END as status,
    'Row Level Security on drivers table' as details
  FROM pg_class 
  WHERE relname = 'drivers' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  -- Check 2: Verify no direct grants exist on drivers table for regular users
  RETURN QUERY
  SELECT 
    'DIRECT_ACCESS_BLOCKED' as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    FORMAT('Found %s direct grants on drivers table for regular users', COUNT(*)) as details
  FROM information_schema.table_privileges 
  WHERE table_name = 'drivers' 
    AND table_schema = 'public' 
    AND grantee IN ('public', 'authenticated', 'anon');

  -- Check 3: Verify secure access functions exist
  RETURN QUERY
  SELECT 
    'SECURE_ACCESS_FUNCTIONS' as check_name,
    CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END as status,
    FORMAT('Found %s secure driver access functions', COUNT(*)) as details
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN ('get_drivers_basic_info', 'search_drivers_for_assignment', 'get_driver_full_data');
END;
$$;

-- ============================================================================
-- 6. ADD SECURITY DOCUMENTATION
-- ============================================================================

-- Add security documentation to critical functions
COMMENT ON FUNCTION public.get_drivers_basic_info() IS 'SECURE: Returns only basic driver info for operators. Logs all access. Use instead of direct table queries.';
COMMENT ON FUNCTION public.search_drivers_for_assignment(text) IS 'SECURE: Allows operators to search drivers for inspection assignment. Limited results, full audit logging.';
COMMENT ON FUNCTION public.get_driver_full_data(uuid) IS 'SECURE: Admin-only function for full driver data access. Complete audit trail maintained.';
COMMENT ON FUNCTION public.validate_driver_access_permission(text) IS 'SECURITY: Validates user permissions for driver-related operations. Central access control point.';
COMMENT ON FUNCTION public.validate_security_setup() IS 'SECURITY: Validates current security configuration. Run periodically to ensure security compliance.';

-- Update final comment on the drivers table
COMMENT ON TABLE public.drivers IS 'CRITICAL SECURITY: Contains highly sensitive PII (CPF, CNH, phone, email, address). 
- Direct table access RESTRICTED by RLS policies
- Operators MUST use get_drivers_basic_info() or search_drivers_for_assignment()  
- Admins MUST use get_driver_full_data() for individual records or existing secure views
- ALL access is logged for audit compliance
- RLS policies enforce role-based access control';