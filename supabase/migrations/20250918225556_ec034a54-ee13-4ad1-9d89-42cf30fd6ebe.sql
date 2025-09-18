-- Fix RLS policies for vehicles table
DROP POLICY IF EXISTS "Authenticated users can create vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;

CREATE POLICY "Users can create vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view vehicles" ON vehicles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update vehicles" ON vehicles FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete vehicles" ON vehicles FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add city and state columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS estado text;

-- Fix storage policies for vehicle photos
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('vehicle-photos', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT (bucket_id, name) DO NOTHING;

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vehicle photos" ON storage.objects;

CREATE POLICY "Users can upload vehicle photos" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view vehicle photos" ON storage.objects 
FOR SELECT USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Users can update vehicle photos" ON storage.objects 
FOR UPDATE USING (bucket_id = 'vehicle-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete vehicle photos" ON storage.objects 
FOR DELETE USING (bucket_id = 'vehicle-photos' AND auth.uid() IS NOT NULL);