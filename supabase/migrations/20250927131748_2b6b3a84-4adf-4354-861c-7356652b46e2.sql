-- Final security cleanup - address remaining linter warnings

-- ============================================================================
-- 1. REMOVE ANY REMAINING INSECURE VIEWS OR OBJECTS
-- ============================================================================

-- Drop any remaining drivers_basic_view that might exist
DROP VIEW IF EXISTS public.drivers_basic_view CASCADE;

-- Check if there are any other security definer views and drop them
-- We'll rely only on secure functions instead

-- ============================================================================
-- 2. ENSURE ALL FUNCTIONS HAVE PROPER SEARCH PATH 
-- ============================================================================

-- Update all existing functions to ensure they have SET search_path = public
-- Starting with handle_new_user which is critical for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'operator'
  );
  RETURN NEW;
END;
$$;

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update validate_driver_data function
CREATE OR REPLACE FUNCTION public.validate_driver_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Validate CPF
    IF NOT validate_cpf(NEW.cpf) THEN
        RAISE EXCEPTION 'CPF inválido: %', NEW.cpf;
    END IF;
    
    -- Validate CNH
    IF NOT validate_cnh(NEW.cnh_numero) THEN
        RAISE EXCEPTION 'CNH inválida: %', NEW.cnh_numero;
    END IF;
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update validate_cpf function
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Remove non-numeric characters
    cpf := regexp_replace(cpf, '[^0-9]', '', 'g');
    
    -- Check if CPF has 11 digits
    IF length(cpf) != 11 THEN
        RETURN false;
    END IF;
    
    -- Check for invalid sequences (all same digits)
    IF cpf ~ '^(.)\1{10}$' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Update validate_cnh function
CREATE OR REPLACE FUNCTION public.validate_cnh(cnh text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Remove non-numeric characters
    cnh := regexp_replace(cnh, '[^0-9]', '', 'g');
    
    -- Check if CNH has 11 digits
    IF length(cnh) != 11 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Update validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one letter
  IF password !~ '[a-zA-Z]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update log_data_access function
CREATE OR REPLACE FUNCTION public.log_data_access(table_name text, record_id uuid, operation text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_data
    ) VALUES (
        auth.uid(),
        operation,
        table_name,
        record_id,
        jsonb_build_object(
            'timestamp', now(),
            'user_role', get_current_user_role(),
            'ip_address', inet_client_addr()
        )
    );
END;
$$;

-- Update log_sensitive_access function
CREATE OR REPLACE FUNCTION public.log_sensitive_access(table_name text, record_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    access_type,
    table_name,
    record_id,
    jsonb_build_object('access_type', access_type, 'timestamp', now())
  );
END;
$$;

-- Update log_driver_access function
CREATE OR REPLACE FUNCTION public.log_driver_access(driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive driver data
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    'DRIVER_ACCESS',
    'drivers',
    driver_id,
    jsonb_build_object(
      'accessed_at', now(),
      'user_role', get_current_user_role(),
      'access_type', 'sensitive_data_view'
    )
  );
END;
$$;

-- ============================================================================
-- 3. ENSURE NO DIRECT ACCESS TO SENSITIVE DATA
-- ============================================================================

-- Remove any remaining broad permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Grant necessary permissions for normal operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.damage_markers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.damage_marker_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_history TO authenticated;

-- Drivers table remains restricted - access only through secure functions
GRANT SELECT ON public.drivers TO service_role;

-- ============================================================================
-- 4. FINAL SECURITY VALIDATION
-- ============================================================================

-- Create a comprehensive security check function
CREATE OR REPLACE FUNCTION public.comprehensive_security_check()
RETURNS TABLE(
  category text,
  check_name text, 
  status text, 
  details text,
  severity text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: RLS enabled on sensitive tables
  RETURN QUERY
  SELECT 
    'ACCESS_CONTROL'::text as category,
    'RLS_DRIVERS_TABLE'::text as check_name,
    CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END as status,
    'Row Level Security on drivers table'::text as details,
    'CRITICAL'::text as severity
  FROM pg_class 
  WHERE relname = 'drivers' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  -- Check 2: No direct access to drivers table
  RETURN QUERY
  SELECT 
    'ACCESS_CONTROL'::text as category,
    'DRIVERS_DIRECT_ACCESS'::text as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    FORMAT('Found %s unauthorized grants on drivers table', COUNT(*))::text as details,
    'CRITICAL'::text as severity
  FROM information_schema.table_privileges 
  WHERE table_name = 'drivers' 
    AND table_schema = 'public' 
    AND grantee IN ('public', 'authenticated', 'anon');

  -- Check 3: Secure functions exist
  RETURN QUERY
  SELECT 
    'SECURE_FUNCTIONS'::text as category,
    'DRIVER_ACCESS_FUNCTIONS'::text as check_name,
    CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as status,
    FORMAT('Found %s secure driver access functions', COUNT(*))::text as details,
    'HIGH'::text as severity
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'get_drivers_basic_info', 
      'search_drivers_for_assignment', 
      'get_driver_full_data',
      'get_drivers_operator_view',
      'get_drivers_secure_view'
    );

  -- Check 4: Functions have search_path set
  RETURN QUERY
  SELECT 
    'FUNCTION_SECURITY'::text as category,
    'SEARCH_PATH_SET'::text as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END as status,
    FORMAT('%s functions may need search_path review', COUNT(*))::text as details,
    'MEDIUM'::text as severity
  FROM information_schema.routines r
  WHERE r.routine_schema = 'public'
    AND r.routine_type = 'FUNCTION'
    AND r.security_type = 'DEFINER'
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' 
        AND p.proname = r.routine_name
        AND 'search_path=public' = ANY(p.proconfig)
    );
END;
$$;

-- Add final documentation
COMMENT ON FUNCTION public.comprehensive_security_check() IS 'SECURITY: Comprehensive validation of security controls. Run regularly to ensure compliance.';

-- Final security notice
COMMENT ON TABLE public.drivers IS 'SECURITY CRITICAL: PII data with restricted access. Use only approved secure functions. All access logged.';
COMMENT ON SCHEMA public IS 'Schema protected by RLS policies and secure functions for sensitive data access.';