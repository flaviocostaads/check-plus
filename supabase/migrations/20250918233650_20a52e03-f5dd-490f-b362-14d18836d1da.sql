-- Fix RLS policies for drivers table to work with authenticated users
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can create drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON public.drivers;

-- Create new policies that work properly with authentication
CREATE POLICY "Authenticated users can view drivers" 
ON public.drivers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update drivers" 
ON public.drivers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete drivers" 
ON public.drivers 
FOR DELETE 
USING (auth.uid() IS NOT NULL);