-- Fix RLS policies for company_settings table to allow all authenticated users to read and admins to write
DROP POLICY IF EXISTS "Only admins can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Only admins can manage company settings" ON public.company_settings;

-- Allow all authenticated users to view company settings (for header/branding)
CREATE POLICY "All authenticated users can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage company settings
CREATE POLICY "Only admins can manage company settings"
ON public.company_settings FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');