-- Fix dashboard data access by creating a simple function for dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_inspections bigint,
  active_vehicles bigint,
  active_drivers bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Get stats for dashboard
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM inspections)::bigint as total_inspections,
    (SELECT COUNT(*) FROM vehicles)::bigint as active_vehicles,
    (SELECT COUNT(*) FROM drivers WHERE is_active = true)::bigint as active_drivers;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;