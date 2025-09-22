-- Corrigir políticas RLS para limitar acesso às informações dos motoristas

-- 1. Remover política existente que permite acesso amplo
DROP POLICY IF EXISTS "Admins have full access to drivers" ON public.drivers;

-- 2. Criar políticas mais restritivas para a tabela drivers
-- Apenas admins podem ver dados completos
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
USING (get_current_user_role() = 'admin');

-- Apenas admins podem deletar motoristas
CREATE POLICY "Admins can delete drivers" 
ON public.drivers 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- 3. Criar política para a view de operadores (dados mascarados)
-- Operadores podem usar a view com dados mascarados para inspeções
CREATE POLICY "Operators can view masked driver data" 
ON public.drivers_operator_view 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'operator'));

-- 4. Garantir que RLS está habilitado
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers_operator_view ENABLE ROW LEVEL SECURITY;

-- 5. Log de auditoria quando dados sensíveis são acessados
CREATE OR REPLACE FUNCTION log_driver_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log quando dados completos do motorista são acessados
  PERFORM log_sensitive_access('drivers', NEW.id, 'SENSITIVE_DRIVER_ACCESS');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;