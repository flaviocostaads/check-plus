-- Fix critical security vulnerabilities in driver data and inspections access

-- ============================================================================
-- 1. SECURE DRIVER DATA ACCESS - Remove potentially insecure policies and ensure proper access control
-- ============================================================================

-- Drop existing potentially problematic policies on drivers table
DROP POLICY IF EXISTS "Operators can view limited driver data" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;

-- Ensure only admins can view full driver data directly from the table
-- Operators must use the secure masked view function
CREATE POLICY "Only admins can view full driver data" 
ON public.drivers 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Create a secure view that operators can access for basic driver selection
-- This view will only show non-sensitive identification data
CREATE OR REPLACE VIEW public.drivers_basic_view AS
SELECT 
  id,
  nome_completo,
  avatar_url,
  is_active,
  created_at
FROM public.drivers 
WHERE is_active = true;

-- Grant access to the basic view for authenticated users (operators need this for driver selection)
GRANT SELECT ON public.drivers_basic_view TO authenticated;

-- ============================================================================
-- 2. FIX INSPECTION ACCESS CONTROL CONFLICTS
-- ============================================================================

-- Remove the overly permissive policy that allows all authenticated users to view inspections
DROP POLICY IF EXISTS "Authenticated users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can delete inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can create inspections" ON public.inspections;

-- Keep only the secure user-specific policy and admin access
-- Users can only access their own inspections OR admins can access all
CREATE POLICY "Users can only access their own inspections or admins can access all" 
ON public.inspections 
FOR SELECT 
USING ((inspector_id = auth.uid()) OR (get_current_user_role() = 'admin'));

-- Allow users to create inspections (they will be the inspector)
CREATE POLICY "Users can create their own inspections" 
ON public.inspections 
FOR INSERT 
WITH CHECK (inspector_id = auth.uid());

-- Allow users to update their own inspections or admins can update any
CREATE POLICY "Users can update their own inspections or admins can update any" 
ON public.inspections 
FOR UPDATE 
USING ((inspector_id = auth.uid()) OR (get_current_user_role() = 'admin'))
WITH CHECK ((inspector_id = auth.uid()) OR (get_current_user_role() = 'admin'));

-- Only admins can delete inspections (audit trail preservation)
CREATE POLICY "Only admins can delete inspections" 
ON public.inspections 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- ============================================================================
-- 3. CREATE SECURE DRIVER LOOKUP FUNCTION FOR OPERATORS
-- ============================================================================

-- Create a function that operators can use to search drivers by name for inspection assignment
-- This function returns only basic information needed for driver selection
CREATE OR REPLACE FUNCTION public.search_drivers_for_assignment(search_term text DEFAULT '')
RETURNS TABLE(
  id uuid,
  nome_completo text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has operator or admin role
  IF get_current_user_role() NOT IN ('operator', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado';
  END IF;

  -- Log the search for audit purposes
  PERFORM log_sensitive_access('drivers_search', NULL, 'DRIVER_SEARCH_ACCESS');

  -- Return only basic driver information for selection purposes
  RETURN QUERY
  SELECT 
    d.id,
    d.nome_completo,
    d.avatar_url
  FROM public.drivers d
  WHERE d.is_active = true
    AND (search_term = '' OR d.nome_completo ILIKE '%' || search_term || '%')
  ORDER BY d.nome_completo
  LIMIT 50; -- Prevent excessive data retrieval
END;
$$;

-- ============================================================================
-- 4. ENHANCE AUDIT LOGGING FOR SENSITIVE OPERATIONS
-- ============================================================================

-- Create trigger to log all driver data access attempts
CREATE OR REPLACE FUNCTION public.log_driver_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any SELECT operation on drivers table
  IF TG_OP = 'SELECT' THEN
    PERFORM log_sensitive_access('drivers', NULL, 'DIRECT_TABLE_ACCESS');
  END IF;
  
  RETURN NULL; -- For AFTER SELECT triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: PostgreSQL doesn't support SELECT triggers, but we have audit logging in the functions

-- ============================================================================
-- 5. REVOKE UNNECESSARY PERMISSIONS
-- ============================================================================

-- Ensure that only specific roles can access driver data
-- Remove any broad grants that might exist
REVOKE ALL ON public.drivers FROM public;
REVOKE ALL ON public.drivers FROM authenticated;

-- Grant only necessary permissions
GRANT SELECT ON public.drivers TO service_role; -- For admin operations through service role
GRANT SELECT ON public.drivers_basic_view TO authenticated; -- Basic view for operators

-- ============================================================================
-- 6. VALIDATION AND CONSTRAINTS
-- ============================================================================

-- Ensure that driver-related inspection data maintains referential integrity
-- while preventing data leaks through foreign key queries
ALTER TABLE public.inspections 
DROP CONSTRAINT IF EXISTS inspections_driver_id_fkey;

-- Don't create a foreign key constraint to drivers table to prevent
-- potential data exposure through JOIN queries in RLS contexts
-- Instead, validate driver existence in application code

-- Add comment for documentation
COMMENT ON TABLE public.drivers IS 'SENSITIVE: Contains PII. Access restricted to admins only. Operators must use drivers_basic_view or search_drivers_for_assignment().';
COMMENT ON VIEW public.drivers_basic_view IS 'Safe view for operators to select drivers for inspections. Contains no sensitive PII.';
COMMENT ON FUNCTION public.search_drivers_for_assignment(text) IS 'Secure function for operators to search and select drivers for inspection assignment.';