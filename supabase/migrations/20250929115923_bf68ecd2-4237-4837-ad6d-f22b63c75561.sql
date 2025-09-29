-- Atualizar políticas RLS para permitir que supervisores e operadores criem inspeções
DROP POLICY IF EXISTS "Users can create their own inspections" ON public.inspections;

-- Nova política que permite criação de inspeções para todos os usuários autenticados (operadores, supervisores, inspetores, admins)
CREATE POLICY "Authenticated users can create inspections" 
ON public.inspections 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  inspector_id = auth.uid() AND
  get_current_user_role() IN ('operator', 'supervisor', 'inspector', 'admin')
);

-- Atualizar política de UPDATE para permitir que supervisores e operadores editem inspeções
DROP POLICY IF EXISTS "Users can update inspections based on role" ON public.inspections;

CREATE POLICY "Users can update inspections based on role" 
ON public.inspections 
FOR UPDATE 
USING (
  ((inspector_id = auth.uid()) AND (get_current_user_role() IN ('inspector', 'operator', 'supervisor'))) OR 
  (get_current_user_role() IN ('admin', 'supervisor'))
)
WITH CHECK (
  ((inspector_id = auth.uid()) AND (get_current_user_role() IN ('inspector', 'operator', 'supervisor'))) OR 
  (get_current_user_role() IN ('admin', 'supervisor'))
);