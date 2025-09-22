-- Critical Security Fix 1: Restrict Driver Data Access with Role-Based Policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can view all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Operators can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can create drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Only admins can delete drivers" ON public.drivers;

-- Create secure role-based policies for drivers table
CREATE POLICY "Admins can manage all drivers" ON public.drivers
FOR ALL USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Operators can only view active drivers for inspections" ON public.drivers
FOR SELECT USING (
  get_current_user_role() = 'operator' AND 
  is_active = true
);

-- Critical Security Fix 2: Enhance Company Settings Security

-- Drop existing policies on company_settings
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Only admins can modify company settings" ON public.company_settings;

-- Create restrictive policies for company settings
CREATE POLICY "Only admins can view company settings" ON public.company_settings
FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can manage company settings" ON public.company_settings
FOR ALL USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Critical Security Fix 3: Add audit logging for sensitive driver data access
CREATE OR REPLACE FUNCTION public.audit_driver_access()
RETURNS TRIGGER AS $$
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
    NEW.id,
    jsonb_build_object(
      'accessed_fields', 'cpf,cnh_numero,telefone,endereco,email',
      'timestamp', now(),
      'user_role', get_current_user_role()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for audit logging on driver SELECT operations
CREATE TRIGGER audit_driver_access_trigger
  AFTER SELECT ON public.drivers
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION public.audit_driver_access();

-- Critical Security Fix 4: Create secure view for operators with masked sensitive data
CREATE OR REPLACE VIEW public.drivers_public_view AS
SELECT 
  id,
  nome_completo,
  -- Mask CPF (show only last 4 digits)
  CASE 
    WHEN get_current_user_role() = 'admin' THEN cpf
    ELSE CONCAT('***.***.***-', RIGHT(cpf, 2))
  END as cpf_masked,
  -- Mask phone (show only area code)
  CASE 
    WHEN get_current_user_role() = 'admin' THEN telefone
    ELSE CASE 
      WHEN telefone IS NOT NULL THEN CONCAT('(', LEFT(telefone, 2), ') ***-****')
      ELSE NULL
    END
  END as telefone_masked,
  -- Hide sensitive fields for operators
  CASE 
    WHEN get_current_user_role() = 'admin' THEN endereco
    ELSE '[RESTRICTED]'
  END as endereco_display,
  CASE 
    WHEN get_current_user_role() = 'admin' THEN email
    ELSE '[RESTRICTED]'
  END as email_display,
  cnh_numero,
  cnh_validade,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.drivers
WHERE 
  (get_current_user_role() = 'admin') OR 
  (get_current_user_role() = 'operator' AND is_active = true);

-- Grant access to the secure view
GRANT SELECT ON public.drivers_public_view TO authenticated;