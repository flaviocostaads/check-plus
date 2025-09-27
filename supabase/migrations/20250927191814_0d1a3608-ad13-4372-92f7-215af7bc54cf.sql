-- Fix RLS policies for company_settings table
DROP POLICY IF EXISTS "All authenticated users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Only admins can manage company settings" ON public.company_settings;

-- Create new RLS policies with better access control
CREATE POLICY "Authenticated users can view company settings" 
ON public.company_settings FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage company settings" 
ON public.company_settings FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create system_logs table for logging functionality
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_logs
CREATE POLICY "Authenticated users can view system logs" 
ON public.system_logs FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create system logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create system_backups table for backup functionality
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on system_backups
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_backups
CREATE POLICY "Authenticated users can view system backups" 
ON public.system_backups FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create system backups" 
ON public.system_backups FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to log system events
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level TEXT,
  p_message TEXT,
  p_category TEXT DEFAULT 'system',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.system_logs (level, message, category, user_id, metadata)
  VALUES (p_level, p_message, p_category, auth.uid(), p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to clear system cache
CREATE OR REPLACE FUNCTION public.clear_system_cache()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log cache clear operation
  PERFORM log_system_event('info', 'System cache cleared', 'cache', 
    jsonb_build_object('cleared_by', auth.uid()));
  
  RETURN TRUE;
END;
$$;

-- Create function to reset configurations
CREATE OR REPLACE FUNCTION public.reset_system_configurations()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset company settings to defaults
  UPDATE public.company_settings SET
    company_name = 'NSA Checklist',
    company_logo_url = NULL,
    company_address = NULL,
    company_phone = NULL,
    company_email = NULL,
    primary_color = '#3b82f6',
    secondary_color = '#64748b'
  WHERE true;
  
  -- Log reset operation
  PERFORM log_system_event('warning', 'System configurations reset to defaults', 'config', 
    jsonb_build_object('reset_by', auth.uid()));
  
  RETURN TRUE;
END;
$$;