-- Critical Security Fixes: Role-based Driver Data Access

-- Drop existing permissive policies on drivers table
DROP POLICY IF EXISTS "Operators can only view active drivers for inspections" ON public.drivers;
DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.drivers;

-- Create more restrictive role-based policies for drivers table
CREATE POLICY "Admins have full access to drivers" ON public.drivers
FOR ALL USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Operators can only view basic driver info" ON public.drivers
FOR SELECT USING (
  get_current_user_role() = 'operator' 
  AND is_active = true
);

-- Create a secure view for operators with masked sensitive data
CREATE OR REPLACE VIEW public.drivers_operator_view AS
SELECT 
  id,
  nome_completo,
  -- Mask CPF - show only last 3 digits
  CASE 
    WHEN get_current_user_role() = 'admin' THEN cpf
    ELSE '***.***.***-' || RIGHT(cpf, 2)
  END as cpf_masked,
  -- Show CNH number but mask middle digits
  CASE 
    WHEN get_current_user_role() = 'admin' THEN cnh_numero
    ELSE LEFT(cnh_numero, 3) || '****' || RIGHT(cnh_numero, 3)
  END as cnh_numero_masked,
  cnh_validade,
  -- Mask phone number
  CASE 
    WHEN get_current_user_role() = 'admin' THEN telefone
    ELSE '(**) ****-' || RIGHT(telefone, 4)
  END as telefone_masked,
  avatar_url,
  created_at,
  updated_at,
  is_active
FROM public.drivers
WHERE is_active = true;

-- Enable RLS on the operator view
ALTER VIEW public.drivers_operator_view SET (security_invoker = true);

-- Create policy for the operator view
CREATE POLICY "Authenticated users can view driver operator view" ON public.drivers_operator_view
FOR SELECT USING (auth.role() = 'authenticated');

-- Add audit logging function for sensitive driver data access
CREATE OR REPLACE FUNCTION public.log_driver_access(driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create function to enforce password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Add audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(table_name text, record_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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