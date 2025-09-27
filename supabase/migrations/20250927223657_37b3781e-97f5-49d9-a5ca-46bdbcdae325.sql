-- Enhanced security for driver personal data - Phase 1
-- 1. Create enhanced audit log for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  field_accessed TEXT NOT NULL,
  access_reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the audit log
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view sensitive data access logs"
ON public.sensitive_data_access_log
FOR SELECT
USING (get_current_user_role() = 'admin');

-- 2. Create a session-based sensitive access tracking table
CREATE TABLE IF NOT EXISTS public.sensitive_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'basic',
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sensitive access sessions
ALTER TABLE public.sensitive_access_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can manage their own sensitive access sessions"
ON public.sensitive_access_sessions
FOR ALL
USING (user_id = auth.uid());

-- 3. Enhanced function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name TEXT,
  p_record_id UUID,
  p_field_accessed TEXT,
  p_access_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sensitive_data_access_log (
    user_id,
    table_name,
    record_id,
    field_accessed,
    access_reason,
    ip_address
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_record_id,
    p_field_accessed,
    p_access_reason,
    COALESCE(inet_client_addr()::TEXT, 'unknown')
  );
END;
$$;

-- 4. Function to create sensitive access session
CREATE OR REPLACE FUNCTION public.create_sensitive_access_session(
  p_access_level TEXT,
  p_justification TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only admins can create sensitive access sessions
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: only administrators can create sensitive access sessions';
  END IF;

  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Set expiration based on access level (shorter for more sensitive data)
  CASE p_access_level
    WHEN 'sensitive' THEN expires_at := now() + interval '1 hour';
    WHEN 'full_pii' THEN expires_at := now() + interval '30 minutes';
    ELSE expires_at := now() + interval '2 hours';
  END CASE;

  -- Insert session
  INSERT INTO public.sensitive_access_sessions (
    user_id,
    session_token,
    expires_at,
    access_level,
    justification
  ) VALUES (
    auth.uid(),
    session_token,
    expires_at,
    p_access_level,
    p_justification
  );

  -- Log the session creation
  PERFORM log_sensitive_data_access('sensitive_access_sessions', NULL, 'session_created', p_justification);

  RETURN session_token;
END;
$$;

-- 5. Function to validate sensitive access session
CREATE OR REPLACE FUNCTION public.validate_sensitive_access_session(
  p_session_token TEXT,
  p_required_level TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record sensitive_access_sessions;
  level_hierarchy INTEGER;
  required_hierarchy INTEGER;
BEGIN
  -- Get session record
  SELECT * INTO session_record
  FROM public.sensitive_access_sessions
  WHERE session_token = p_session_token
    AND user_id = auth.uid()
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check access level hierarchy (higher number = more access)
  CASE session_record.access_level
    WHEN 'basic' THEN level_hierarchy := 1;
    WHEN 'sensitive' THEN level_hierarchy := 2;
    WHEN 'full_pii' THEN level_hierarchy := 3;
    ELSE level_hierarchy := 0;
  END CASE;

  CASE p_required_level
    WHEN 'basic' THEN required_hierarchy := 1;
    WHEN 'sensitive' THEN required_hierarchy := 2;
    WHEN 'full_pii' THEN required_hierarchy := 3;
    ELSE required_hierarchy := 999;
  END CASE;

  RETURN level_hierarchy >= required_hierarchy;
END;
$$;

-- 6. Enhanced function to get driver data with session validation
CREATE OR REPLACE FUNCTION public.get_driver_data_secure(
  p_driver_id UUID,
  p_session_token TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  nome_completo TEXT,
  cpf TEXT,
  cnh_numero TEXT,
  cnh_validade TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  driver_record drivers;
  can_access_sensitive BOOLEAN := FALSE;
  can_access_full_pii BOOLEAN := FALSE;
BEGIN
  -- Validate user is admin
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: only administrators can access driver data';
  END IF;

  -- Validate session for sensitive data if token provided
  IF p_session_token IS NOT NULL THEN
    can_access_sensitive := validate_sensitive_access_session(p_session_token, 'sensitive');
    can_access_full_pii := validate_sensitive_access_session(p_session_token, 'full_pii');
  END IF;

  -- Get driver record
  SELECT * INTO driver_record FROM public.drivers WHERE drivers.id = p_driver_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver not found';
  END IF;

  -- Log the access
  PERFORM log_sensitive_data_access('drivers', p_driver_id, 'driver_access', 
    CASE 
      WHEN can_access_full_pii THEN 'full_pii_access'
      WHEN can_access_sensitive THEN 'sensitive_access'
      ELSE 'basic_access'
    END);

  -- Return data based on session permissions with progressive masking
  RETURN QUERY
  SELECT 
    driver_record.id,
    driver_record.nome_completo,
    CASE 
      WHEN can_access_full_pii THEN driver_record.cpf
      WHEN can_access_sensitive THEN 
        SUBSTRING(driver_record.cpf FROM 1 FOR 3) || '.***.***-' || SUBSTRING(driver_record.cpf FROM LENGTH(driver_record.cpf) - 1)
      ELSE '***.***.***-**'
    END AS cpf,
    CASE 
      WHEN can_access_full_pii THEN driver_record.cnh_numero
      WHEN can_access_sensitive THEN 
        SUBSTRING(driver_record.cnh_numero FROM 1 FOR 3) || '********'
      ELSE '***********'
    END AS cnh_numero,
    driver_record.cnh_validade,
    CASE WHEN can_access_sensitive THEN driver_record.telefone ELSE NULL END AS telefone,
    CASE WHEN can_access_sensitive THEN driver_record.email ELSE NULL END AS email,
    CASE WHEN can_access_full_pii THEN driver_record.endereco ELSE NULL END AS endereco,
    driver_record.avatar_url,
    driver_record.is_active,
    driver_record.created_at,
    driver_record.updated_at;
END;
$$;

-- 7. Function to check business hours (additional security layer)
CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXTRACT(hour FROM now() AT TIME ZONE 'America/Sao_Paulo') BETWEEN 6 AND 20
  AND EXTRACT(dow FROM now() AT TIME ZONE 'America/Sao_Paulo') BETWEEN 1 AND 5;
$$;

-- 8. Enhanced audit trigger for drivers table
CREATE OR REPLACE FUNCTION public.enhanced_driver_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all operations on drivers table with enhanced details
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP || '_ENHANCED',
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN 
        jsonb_build_object(
          'id', OLD.id,
          'nome_completo', OLD.nome_completo,
          'cpf_masked', SUBSTRING(OLD.cpf FROM 1 FOR 3) || '.***.***-**',
          'business_hours', is_business_hours(),
          'timestamp', now()
        )
      ELSE NULL 
    END,
    CASE 
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN 
        jsonb_build_object(
          'id', NEW.id,
          'nome_completo', NEW.nome_completo,
          'cpf_masked', SUBSTRING(NEW.cpf FROM 1 FOR 3) || '.***.***-**',
          'business_hours', is_business_hours(),
          'timestamp', now()
        )
      ELSE NULL 
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS enhanced_driver_audit_trigger ON public.drivers;
CREATE TRIGGER enhanced_driver_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION enhanced_driver_audit_trigger();