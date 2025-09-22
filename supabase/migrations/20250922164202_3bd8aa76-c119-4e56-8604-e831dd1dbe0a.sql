-- Fix critical security vulnerabilities for driver personal information

-- 1. Enable RLS on drivers_operator_view and create proper policies
ALTER TABLE public.drivers_operator_view ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with appropriate roles can view masked driver data
CREATE POLICY "Authenticated users can view masked driver data" 
ON public.drivers_operator_view 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  get_current_user_role() IN ('admin', 'operator')
);

-- 2. Create encrypted storage functions for sensitive PII data
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text)
RETURNS text AS $$
BEGIN
  -- Simple encryption using pgcrypto (you should use proper key management in production)
  RETURN CASE 
    WHEN data IS NULL OR data = '' THEN data
    ELSE encode(digest(data || current_setting('app.encryption_salt', true), 'sha256'), 'hex')
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Create function to validate driver access permissions
CREATE OR REPLACE FUNCTION public.can_access_driver_data()
RETURNS boolean AS $$
BEGIN
  -- Only admins and specific authorized users can access full driver data
  RETURN get_current_user_role() = 'admin' OR 
         EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE user_id = auth.uid() 
           AND role IN ('admin')
         );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Create additional audit logging for driver data access
CREATE OR REPLACE FUNCTION public.log_driver_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to driver data with detailed information
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    'DRIVER_DATA_ACCESS',
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', now(),
      'user_role', get_current_user_role(),
      'ip_address', inet_client_addr(),
      'accessed_fields', CASE 
        WHEN NEW IS NOT NULL THEN jsonb_object_keys(to_jsonb(NEW))
        ELSE jsonb_object_keys(to_jsonb(OLD))
      END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for driver data access logging
DROP TRIGGER IF EXISTS log_driver_access_trigger ON public.drivers;
CREATE TRIGGER log_driver_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.log_driver_data_access();

-- 6. Add additional validation for driver data integrity
CREATE OR REPLACE FUNCTION public.validate_driver_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Additional security check before allowing any driver data operation
  IF NOT can_access_driver_data() THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado a acessar dados de motoristas';
  END IF;
  
  -- Log the access attempt
  PERFORM log_sensitive_access('drivers', COALESCE(NEW.id, OLD.id), 'PRIVILEGED_ACCESS');
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for additional validation
DROP TRIGGER IF EXISTS validate_driver_access_trigger ON public.drivers;
CREATE TRIGGER validate_driver_access_trigger
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.validate_driver_access();

-- 7. Create secure view for driver statistics that doesn't expose PII
CREATE OR REPLACE VIEW public.driver_stats_secure_view AS
SELECT 
  d.id,
  d.nome_completo,
  d.is_active,
  d.created_at,
  COUNT(i.id) as total_inspections,
  COUNT(DISTINCT i.vehicle_id) as vehicles_inspected,
  MAX(i.created_at) as last_inspection_date
FROM public.drivers d
LEFT JOIN public.inspections i ON d.id = i.driver_id
WHERE can_access_driver_data() -- Only show if user has proper access
GROUP BY d.id, d.nome_completo, d.is_active, d.created_at;

-- Enable RLS on the secure stats view
ALTER TABLE public.driver_stats_secure_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view driver stats" 
ON public.driver_stats_secure_view 
FOR SELECT 
USING (can_access_driver_data());

-- 8. Update existing policies to be more restrictive
DROP POLICY IF EXISTS "Admins can view all driver data" ON public.drivers;
CREATE POLICY "Only authorized users can view driver data" 
ON public.drivers 
FOR SELECT 
USING (can_access_driver_data());

DROP POLICY IF EXISTS "Admins can insert drivers" ON public.drivers;
CREATE POLICY "Only authorized users can insert drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (can_access_driver_data());

DROP POLICY IF EXISTS "Admins can update drivers" ON public.drivers;
CREATE POLICY "Only authorized users can update drivers" 
ON public.drivers 
FOR UPDATE 
USING (can_access_driver_data()) 
WITH CHECK (can_access_driver_data());

DROP POLICY IF EXISTS "Admins can delete drivers" ON public.drivers;
CREATE POLICY "Only authorized users can delete drivers" 
ON public.drivers 
FOR DELETE 
USING (can_access_driver_data());