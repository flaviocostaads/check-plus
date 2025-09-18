-- Create enum types
CREATE TYPE public.vehicle_type AS ENUM ('car', 'moto');
CREATE TYPE public.inspection_status AS ENUM ('ok', 'needs_replacement', 'observation');
CREATE TYPE public.user_role AS ENUM ('admin', 'operator');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca_modelo TEXT NOT NULL,
  placa TEXT NOT NULL UNIQUE,
  cor TEXT NOT NULL,
  ano TEXT NOT NULL,
  renavam TEXT NOT NULL,
  km_atual TEXT,
  vehicle_type vehicle_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist templates table
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL,
  driver_name TEXT NOT NULL,
  driver_cpf TEXT NOT NULL,
  driver_cnh TEXT NOT NULL,
  driver_cnh_validade TEXT NOT NULL,
  signature_data TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection items table
CREATE TABLE public.inspection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id),
  status inspection_status NOT NULL,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection photos table
CREATE TABLE public.inspection_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create damage markers table
CREATE TABLE public.damage_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  x_position DECIMAL NOT NULL,
  y_position DECIMAL NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create damage marker photos table
CREATE TABLE public.damage_marker_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  damage_marker_id UUID NOT NULL REFERENCES public.damage_markers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_marker_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for vehicles (all authenticated users can view and manage)
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for checklist templates
CREATE POLICY "Authenticated users can view checklist templates" ON public.checklist_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create checklist templates" ON public.checklist_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update checklist templates" ON public.checklist_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete checklist templates" ON public.checklist_templates FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for inspections
CREATE POLICY "Authenticated users can view inspections" ON public.inspections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create inspections" ON public.inspections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update inspections" ON public.inspections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete inspections" ON public.inspections FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for inspection items
CREATE POLICY "Authenticated users can view inspection items" ON public.inspection_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create inspection items" ON public.inspection_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update inspection items" ON public.inspection_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete inspection items" ON public.inspection_items FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for inspection photos
CREATE POLICY "Authenticated users can view inspection photos" ON public.inspection_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create inspection photos" ON public.inspection_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update inspection photos" ON public.inspection_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete inspection photos" ON public.inspection_photos FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for damage markers
CREATE POLICY "Authenticated users can view damage markers" ON public.damage_markers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create damage markers" ON public.damage_markers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update damage markers" ON public.damage_markers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete damage markers" ON public.damage_markers FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for damage marker photos
CREATE POLICY "Authenticated users can view damage marker photos" ON public.damage_marker_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create damage marker photos" ON public.damage_marker_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update damage marker photos" ON public.damage_marker_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete damage marker photos" ON public.damage_marker_photos FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspection_items_updated_at BEFORE UPDATE ON public.inspection_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default checklist templates for cars
INSERT INTO public.checklist_templates (name, vehicle_type, requires_photo) VALUES
('Pneus (dianteiros/traseiros)', 'car', false),
('Freios (pastilhas, discos, fluido)', 'car', false),
('Suspensão (dianteira/traseira)', 'car', false),
('Óleo do motor', 'car', false),
('Óleo de câmbio/diferencial', 'car', false),
('Água do radiador (arrefecimento)', 'car', false),
('Fluído de direção hidráulica', 'car', false),
('Fluído do limpador de para-brisa', 'car', false),
('Faróis (alto/baixo)', 'car', true),
('Lanternas traseiras', 'car', true),
('Setas (dianteiras/traseiras)', 'car', true),
('Luz de freio', 'car', true),
('Luz de ré', 'car', true),
('Buzina', 'car', false),
('Retrovisores', 'car', true),
('Painel de instrumentos', 'car', false),
('Cinto de segurança', 'car', false),
('Estepe (pneu reserva)', 'car', false),
('Macaco e chave de roda', 'car', false),
('Triângulo de sinalização', 'car', false),
('Extintor de incêndio (validade)', 'car', false),
('Documentação (CRLV, seguro)', 'car', false),
('Chave reserva', 'car', false);

-- Insert default checklist templates for motorcycles
INSERT INTO public.checklist_templates (name, vehicle_type, requires_photo) VALUES
('Pneus dianteiro/traseiro', 'moto', false),
('Freios (pastilhas e disco)', 'moto', false),
('Suspensão dianteira/traseira', 'moto', false),
('Óleo do motor', 'moto', false),
('Nível do combustível', 'moto', false),
('Farol dianteiro/traseiro', 'moto', true),
('Setas', 'moto', true),
('Buzina', 'moto', false),
('Espelhos', 'moto', true),
('Retrovisores', 'moto', true),
('Painel de instrumentos', 'moto', false),
('Corrente e Coroa', 'moto', false),
('Chave reserva', 'moto', false),
('Documentação (CRLV)', 'moto', false);