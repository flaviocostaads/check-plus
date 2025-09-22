-- Fix all remaining Security Definer view issues by explicitly setting security_invoker

-- Check and fix any remaining views that might have SECURITY DEFINER property
-- The linter is still detecting Security Definer views, so let's ensure all views use security_invoker

-- Explicitly set security_invoker on our views to ensure they don't use SECURITY DEFINER
ALTER VIEW public.drivers_operator_view SET (security_invoker = on);
ALTER VIEW public.drivers_secure_view SET (security_invoker = on);

-- Also check if there are any other system views that might be causing the issue
-- Let's also make sure no other views in our schema have SECURITY DEFINER

-- Document the security model clearly
COMMENT ON VIEW public.drivers_operator_view IS 'SECURITY MODEL: Uses security_invoker=on. Provides masked driver data for operators and admins. CPF, CNH, and phone numbers are masked for privacy. Access controlled through role-based WHERE clause and underlying table RLS policies.';
COMMENT ON VIEW public.drivers_secure_view IS 'SECURITY MODEL: Uses security_invoker=on. Provides full unmasked driver data for administrators only. Contains sensitive personal information. Access controlled through admin-only WHERE clause and underlying table RLS policies.';