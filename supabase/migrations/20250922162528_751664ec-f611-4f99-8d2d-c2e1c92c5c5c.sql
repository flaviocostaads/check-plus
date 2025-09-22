-- Corrigir políticas RLS para proteger informações dos motoristas

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Admins have full access to drivers" ON public.drivers;

-- 2. Criar políticas granulares para a tabela drivers
-- Apenas admins podem ver dados completos dos motoristas
CREATE POLICY "Admins can view all driver data" 
ON public.drivers 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Apenas admins podem inserir novos motoristas  
CREATE POLICY "Admins can insert drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin');

-- Apenas admins podem atualizar motoristas
CREATE POLICY "Admins can update drivers" 
ON public.drivers 
FOR UPDATE 
USING (get_current_user_role() = 'admin') 
WITH CHECK (get_current_user_role() = 'admin');

-- Apenas admins podem deletar motoristas
CREATE POLICY "Admins can delete drivers" 
ON public.drivers 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- 3. Garantir que RLS está habilitado na tabela drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se a view drivers_operator_view existe e funciona corretamente
-- (A view já deve estar configurada para mostrar dados mascarados para operadores)