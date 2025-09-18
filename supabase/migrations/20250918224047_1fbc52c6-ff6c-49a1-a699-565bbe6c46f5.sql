-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('vehicle-photos', 'vehicle-photos', true),
  ('odometer-photos', 'odometer-photos', true),
  ('inspection-photos', 'inspection-photos', true),
  ('company-assets', 'company-assets', true);

-- Create storage policies for vehicle photos
CREATE POLICY "Vehicle photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Authenticated users can upload vehicle photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');

-- Create storage policies for odometer photos
CREATE POLICY "Odometer photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'odometer-photos');

CREATE POLICY "Authenticated users can upload odometer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'odometer-photos' AND auth.role() = 'authenticated');

-- Create storage policies for inspection photos
CREATE POLICY "Inspection photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inspection-photos');

CREATE POLICY "Authenticated users can upload inspection photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'inspection-photos' AND auth.role() = 'authenticated');

-- Create storage policies for company assets
CREATE POLICY "Company assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can upload company assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

-- Add photo_url to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN photo_url TEXT;

-- Add odometer_photo_url to inspections table
ALTER TABLE public.inspections 
ADD COLUMN odometer_photo_url TEXT;

-- Create company_settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company_settings
CREATE POLICY "Authenticated users can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create company settings" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update company settings" 
ON public.company_settings 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Add trigger for company_settings timestamps
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (company_name, company_address, company_phone, company_email)
VALUES ('NSA Checklist', 'Endereço da Empresa', '(11) 99999-9999', 'contato@nsachecklist.com');

-- Create integrations table for third-party connections
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for integrations
CREATE POLICY "Authenticated users can view integrations" 
ON public.integrations 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update integrations" 
ON public.integrations 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete integrations" 
ON public.integrations 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Add trigger for integrations timestamps
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();