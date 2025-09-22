-- Create bucket for odometer photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('odometer-photos', 'odometer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for odometer photos bucket
CREATE POLICY "Users can upload odometer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'odometer-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view odometer photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'odometer-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update odometer photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'odometer-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete odometer photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'odometer-photos' AND auth.role() = 'authenticated');