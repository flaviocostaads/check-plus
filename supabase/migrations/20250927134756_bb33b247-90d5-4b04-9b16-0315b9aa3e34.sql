-- Second migration: Create user management system
CREATE TABLE IF NOT EXISTS public.user_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL UNIQUE,
  can_create_users BOOLEAN DEFAULT false,
  can_delete_users BOOLEAN DEFAULT false,
  can_view_all_inspections BOOLEAN DEFAULT false,
  can_edit_all_inspections BOOLEAN DEFAULT false,
  can_manage_vehicles BOOLEAN DEFAULT true,
  can_manage_drivers BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  can_manage_settings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert role permissions
INSERT INTO public.user_role_permissions (role, can_create_users, can_delete_users, can_view_all_inspections, can_edit_all_inspections, can_manage_settings) 
VALUES 
  ('admin', true, true, true, true, true),
  ('supervisor', true, false, true, true, false),
  ('inspector', false, false, false, false, false),
  ('operator', false, false, false, false, false)
ON CONFLICT (role) DO UPDATE SET
  can_create_users = EXCLUDED.can_create_users,
  can_delete_users = EXCLUDED.can_delete_users,
  can_view_all_inspections = EXCLUDED.can_view_all_inspections,
  can_edit_all_inspections = EXCLUDED.can_edit_all_inspections,
  can_manage_settings = EXCLUDED.can_manage_settings;

-- Enable RLS
ALTER TABLE public.user_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for permissions table
CREATE POLICY "Only admins can manage role permissions" 
ON public.user_role_permissions 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Update inspections policies to handle new roles
DROP POLICY IF EXISTS "Users can only access their own inspections or admins can acces" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections or admins can update any" ON public.inspections;

CREATE POLICY "Users can view inspections based on role" 
ON public.inspections 
FOR SELECT 
USING (
  inspector_id = auth.uid() OR 
  get_current_user_role() IN ('admin', 'supervisor')
);

CREATE POLICY "Users can update inspections based on role" 
ON public.inspections 
FOR UPDATE 
USING (
  (inspector_id = auth.uid() AND get_current_user_role() IN ('inspector', 'operator')) OR
  get_current_user_role() IN ('admin', 'supervisor')
)
WITH CHECK (
  (inspector_id = auth.uid() AND get_current_user_role() IN ('inspector', 'operator')) OR
  get_current_user_role() IN ('admin', 'supervisor')
);

-- Update profiles policies for user management
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

CREATE POLICY "Users can view profiles based on role" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_current_user_role() IN ('admin', 'supervisor')
);

-- Allow supervisors to create users but not delete admins
CREATE POLICY "Supervisors can create users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  get_current_user_role() IN ('admin', 'supervisor')
);

CREATE POLICY "Supervisors can update users" 
ON public.profiles 
FOR UPDATE 
USING (
  get_current_user_role() IN ('admin', 'supervisor') AND
  (get_current_user_role() = 'admin' OR 
   (SELECT role FROM public.profiles WHERE user_id = profiles.user_id) != 'admin')
);

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_role user_role)
RETURNS TABLE(
  can_create_users BOOLEAN,
  can_delete_users BOOLEAN,
  can_view_all_inspections BOOLEAN,
  can_edit_all_inspections BOOLEAN,
  can_manage_vehicles BOOLEAN,
  can_manage_drivers BOOLEAN,
  can_access_reports BOOLEAN,
  can_manage_settings BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.can_create_users,
    p.can_delete_users,
    p.can_view_all_inspections,
    p.can_edit_all_inspections,
    p.can_manage_vehicles,
    p.can_manage_drivers,
    p.can_access_reports,
    p.can_manage_settings
  FROM public.user_role_permissions p
  WHERE p.role = user_role;
$$;