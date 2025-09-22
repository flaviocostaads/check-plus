-- Critical Security Fixes Migration

-- 1. Update drivers table RLS policies to be role-based
DROP POLICY IF EXISTS "Users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can create drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can update drivers" ON public.drivers;

-- Create new role-based policies for drivers table
CREATE POLICY "Admins can view all drivers" ON public.drivers
FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Operators can view drivers" ON public.drivers
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'operator') AND is_active = true
);

CREATE POLICY "Admins can create drivers" ON public.drivers
FOR INSERT WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update drivers" ON public.drivers
FOR UPDATE USING (get_current_user_role() = 'admin');

-- 2. Add audit logging trigger for drivers table
CREATE TRIGGER audit_drivers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 3. Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name TEXT,
  record_id UUID,
  access_type TEXT
) RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update vehicles table to also be role-based for consistency
DROP POLICY IF EXISTS "Users can view vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Ensure profiles table has proper admin access logging
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();