-- Remove the insecure operator policy that allows direct access to sensitive driver data
DROP POLICY IF EXISTS "Operators can only view basic driver info" ON public.drivers;

-- Ensure only admins can access the drivers table directly
-- The existing admin policy is sufficient for admin access
-- Operators will use the drivers_operator_view which has masked data

-- Add a comment to document the security model
COMMENT ON TABLE public.drivers IS 'Contains sensitive driver personal data. Direct access restricted to admins only. Operators must use drivers_operator_view for masked data access.';