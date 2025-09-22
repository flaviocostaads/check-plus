-- Drop security definer views that bypass RLS policies
DROP VIEW IF EXISTS public.drivers_operator_view;
DROP VIEW IF EXISTS public.drivers_secure_view;

-- The underlying functions get_drivers_operator_view() and get_drivers_secure_view() 
-- can remain as they have proper role checking and audit logging built-in.
-- Code should call these functions directly instead of querying views.

-- Update the drivers table RLS policies to ensure proper access control
-- These policies already exist but let's make sure they're comprehensive

-- Ensure operators cannot directly access sensitive driver data
DROP POLICY IF EXISTS "Operators can view limited driver data" ON public.drivers;
CREATE POLICY "Operators can view limited driver data" 
ON public.drivers 
FOR SELECT 
USING (
  get_current_user_role() IN ('operator', 'admin') 
  AND FALSE -- Force operators to use the secure function instead
);

-- Only admins can directly access the drivers table
DROP POLICY IF EXISTS "Admins can view all driver data" ON public.drivers;
CREATE POLICY "Admins can view all driver data" 
ON public.drivers 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add comment explaining the security model
COMMENT ON TABLE public.drivers IS 'Direct access restricted. Operators must use get_drivers_operator_view() function for masked data. Admins can access directly or use get_drivers_secure_view() for full data.';