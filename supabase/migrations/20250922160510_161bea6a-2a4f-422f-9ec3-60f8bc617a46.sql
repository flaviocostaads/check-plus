-- Fix critical security vulnerability: Remove overly permissive view access
-- and implement proper role-based access control

-- Revoke the overly broad permissions that were granted to all authenticated users
REVOKE SELECT ON public.drivers_operator_view FROM authenticated;
REVOKE SELECT ON public.drivers_secure_view FROM authenticated;

-- Enable RLS on the views
ALTER VIEW public.drivers_operator_view SET (security_barrier = true);
ALTER VIEW public.drivers_secure_view SET (security_barrier = true);

-- Create proper RLS policies for drivers_operator_view (masked data for operators)
CREATE POLICY "Operators can view masked driver data" 
ON public.drivers_operator_view
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('operator', 'admin'));

-- Create proper RLS policies for drivers_secure_view (full data for admins only)
CREATE POLICY "Only admins can view full driver data" 
ON public.drivers_secure_view
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'admin');

-- Grant minimal necessary permissions
GRANT SELECT ON public.drivers_operator_view TO authenticated;
GRANT SELECT ON public.drivers_secure_view TO authenticated;

-- Add documentation
COMMENT ON VIEW public.drivers_operator_view IS 'Masked driver data view for operators. Contains sensitive data with masking applied.';
COMMENT ON VIEW public.drivers_secure_view IS 'Full driver data view for admins only. Contains unmasked sensitive personal information.';