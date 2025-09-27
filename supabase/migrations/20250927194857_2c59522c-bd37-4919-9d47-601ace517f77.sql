-- Drop existing policies and recreate them for company_settings and integrations

-- Drop existing policies for company_settings
DROP POLICY IF EXISTS "Admins can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can insert company settings" ON public.company_settings;  
DROP POLICY IF EXISTS "Admins can update company settings" ON public.company_settings;

-- Drop existing policies for integrations
DROP POLICY IF EXISTS "Admins can view integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins can insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins can update integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins can delete integrations" ON public.integrations;

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create new policies for company_settings
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

-- Create new policies for integrations
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