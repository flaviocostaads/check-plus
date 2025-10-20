-- Corrigir políticas RLS para permitir operadores e supervisores criarem motoristas
DROP POLICY IF EXISTS "Admins can insert drivers" ON public.drivers;

CREATE POLICY "Operators and supervisors can insert drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (
  get_current_user_role() IN ('operator', 'supervisor', 'admin')
);

-- Também permitir que operadores e supervisores atualizem motoristas
DROP POLICY IF EXISTS "Admins can update drivers" ON public.drivers;

CREATE POLICY "Operators and supervisors can update drivers" 
ON public.drivers 
FOR UPDATE 
USING (get_current_user_role() IN ('operator', 'supervisor', 'admin'))
WITH CHECK (get_current_user_role() IN ('operator', 'supervisor', 'admin'));