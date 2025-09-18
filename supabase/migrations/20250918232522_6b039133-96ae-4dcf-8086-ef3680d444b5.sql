-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  cnh_numero TEXT NOT NULL,
  cnh_validade TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Create policies for drivers
CREATE POLICY "Authenticated users can view drivers" 
ON public.drivers 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update drivers" 
ON public.drivers 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete drivers" 
ON public.drivers 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add driver_id to inspections table
ALTER TABLE public.inspections 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id);

-- Create index for better performance
CREATE INDEX idx_drivers_cpf ON public.drivers(cpf);
CREATE INDEX idx_drivers_active ON public.drivers(is_active);
CREATE INDEX idx_inspections_driver_id ON public.inspections(driver_id);