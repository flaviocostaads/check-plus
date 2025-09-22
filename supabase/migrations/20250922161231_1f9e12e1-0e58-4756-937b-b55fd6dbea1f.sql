-- Comprehensive security fixes and improvements

-- 1. Ensure all tables have proper RLS policies
-- Add missing DELETE policy for profiles if needed
DO $$
BEGIN
    -- Check if DELETE policy exists for profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can delete profiles'
        AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Admins can delete profiles" ON public.profiles
        FOR DELETE USING (get_current_user_role() = 'admin');
    END IF;
END $$;

-- 2. Add audit trigger to profiles table for security logging
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 3. Add audit trigger to drivers table for security logging
DROP TRIGGER IF EXISTS audit_drivers_trigger ON public.drivers;
CREATE TRIGGER audit_drivers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 4. Create function to validate CPF format (security measure)
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf text)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to validate CNH format
CREATE OR REPLACE FUNCTION public.validate_cnh(cnh text)
RETURNS boolean AS $$
BEGIN
    -- Remove non-numeric characters
    cnh := regexp_replace(cnh, '[^0-9]', '', 'g');
    
    -- Check if CNH has 11 digits
    IF length(cnh) != 11 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Add validation triggers for drivers table
CREATE OR REPLACE FUNCTION public.validate_driver_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_driver_data_trigger ON public.drivers;
CREATE TRIGGER validate_driver_data_trigger
    BEFORE INSERT OR UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.validate_driver_data();

-- 7. Ensure inspection data is properly secured
CREATE POLICY "Users can only access their own inspections" ON public.inspections
FOR SELECT USING (
    inspector_id = auth.uid() OR 
    get_current_user_role() = 'admin'
);

-- 8. Create security function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_data_access(
    table_name text,
    record_id uuid,
    operation text
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Add password history tracking (for future use)
CREATE TABLE IF NOT EXISTS public.password_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own password history" ON public.password_history
FOR ALL USING (user_id = auth.uid());

-- 10. Add session tracking for security
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sessions" ON public.user_sessions
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
FOR SELECT USING (get_current_user_role() = 'admin');