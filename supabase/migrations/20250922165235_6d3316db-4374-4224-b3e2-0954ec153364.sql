-- Add RLS policies to driver views to protect sensitive personal data

-- Enable RLS on the views (if not already enabled)
ALTER TABLE public.drivers_operator_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers_secure_view ENABLE ROW LEVEL SECURITY;

-- RLS policy for drivers_operator_view - only operators and admins can access
CREATE POLICY "Operators and admins can view masked driver data" 
ON public.drivers_operator_view 
FOR SELECT 
USING (
  get_current_user_role() IN ('operator', 'admin')
);

-- RLS policy for drivers_secure_view - only admins can access full data
CREATE POLICY "Only admins can view full driver data" 
ON public.drivers_secure_view 
FOR SELECT 
USING (
  get_current_user_role() = 'admin'
);

-- Log access to these sensitive views for audit purposes
CREATE OR REPLACE FUNCTION public.log_driver_view_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to driver views
  PERFORM log_sensitive_access(
    TG_TABLE_NAME,
    NEW.id,
    'DRIVER_VIEW_ACCESS'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers for the views (on SELECT operations, we'll log via application)
-- Note: Views don't support AFTER SELECT triggers, so we'll handle logging in the application layer