-- Fix RLS policies to allow operations without authentication for development
-- This is a temporary solution for development - in production you should use proper auth

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can create drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can delete drivers" ON public.drivers;

DROP POLICY IF EXISTS "Users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can create vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated users can create company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated users can update company settings" ON public.company_settings;

DROP POLICY IF EXISTS "Authenticated users can view integrations" ON public.integrations;
DROP POLICY IF EXISTS "Authenticated users can create integrations" ON public.integrations;
DROP POLICY IF EXISTS "Authenticated users can update integrations" ON public.integrations;
DROP POLICY IF EXISTS "Authenticated users can delete integrations" ON public.integrations;

-- Create permissive policies for development
CREATE POLICY "Allow all operations on drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_settings" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on integrations" ON public.integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on checklist_templates" ON public.checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inspection_items" ON public.inspection_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inspection_photos" ON public.inspection_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on damage_markers" ON public.damage_markers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on damage_marker_photos" ON public.damage_marker_photos FOR ALL USING (true) WITH CHECK (true);

-- Add avatar field to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage policies to allow public operations
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-avatars', 'vehicle-avatars', true) ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies that might be restrictive
DELETE FROM storage.policies WHERE bucket_id IN ('vehicle-photos', 'company-assets', 'vehicle-avatars');

-- Create permissive storage policies for development
INSERT INTO storage.policies (id, bucket_id, command, USING, WITH_CHECK)
VALUES 
  ('vehicle_photos_select', 'vehicle-photos', 'SELECT', true, null),
  ('vehicle_photos_insert', 'vehicle-photos', 'INSERT', true, true),
  ('vehicle_photos_update', 'vehicle-photos', 'UPDATE', true, true),
  ('vehicle_photos_delete', 'vehicle-photos', 'DELETE', true, null),
  
  ('company_assets_select', 'company-assets', 'SELECT', true, null),
  ('company_assets_insert', 'company-assets', 'INSERT', true, true),
  ('company_assets_update', 'company-assets', 'UPDATE', true, true),
  ('company_assets_delete', 'company-assets', 'DELETE', true, null),
  
  ('vehicle_avatars_select', 'vehicle-avatars', 'SELECT', true, null),
  ('vehicle_avatars_insert', 'vehicle-avatars', 'INSERT', true, true),
  ('vehicle_avatars_update', 'vehicle-avatars', 'UPDATE', true, true),
  ('vehicle_avatars_delete', 'vehicle-avatars', 'DELETE', true, null);

-- Make sure company_settings table has proper structure for UUID handling
-- Update the id column to have a proper default
ALTER TABLE public.company_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();