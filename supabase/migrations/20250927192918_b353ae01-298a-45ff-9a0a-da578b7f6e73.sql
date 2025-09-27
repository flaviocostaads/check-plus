-- Drop and recreate the function to fix the return type
DROP FUNCTION IF EXISTS get_drivers_basic_info();

-- Create function to get drivers basic info for driver selection
CREATE OR REPLACE FUNCTION get_drivers_basic_info()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  avatar_url text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.nome_completo,
    d.avatar_url,
    d.is_active
  FROM drivers d
  WHERE d.is_active = true
  ORDER BY d.nome_completo;
$$;