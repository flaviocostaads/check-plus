-- Create RLS policies for company_settings and integrations tables

-- Enable RLS on company_settings if not already enabled
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company_settings (only admins can access)
CREATE POLICY "Admins can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert company settings" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update company settings" 
ON public.company_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Enable RLS on integrations if not already enabled
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for integrations (only admins can access)
CREATE POLICY "Admins can view integrations" 
ON public.integrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update integrations" 
ON public.integrations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete integrations" 
ON public.integrations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);