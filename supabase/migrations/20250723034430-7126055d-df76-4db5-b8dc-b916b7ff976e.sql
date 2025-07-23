-- Recriar as views sem SECURITY DEFINER para corrigir problemas de segurança
DROP VIEW IF EXISTS public.trip_statistics;
DROP VIEW IF EXISTS public.sector_statistics;
DROP VIEW IF EXISTS public.vehicle_statistics;

-- Criar view de estatísticas de viagens sem SECURITY DEFINER
CREATE VIEW public.trip_statistics AS
SELECT 
  DATE_TRUNC('month', trip_date) as month,
  COUNT(*) as total_trips,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_trips,
  ARRAY_AGG(DISTINCT sector) as sectors,
  ARRAY_AGG(DISTINCT vehicle_id) FILTER (WHERE vehicle_id IS NOT NULL) as vehicles_used
FROM public.trips
WHERE trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', trip_date)
ORDER BY month;

-- Criar view de estatísticas por setor sem SECURITY DEFINER
CREATE VIEW public.sector_statistics AS
SELECT 
  s.name as sector_name,
  COUNT(t.id) as trip_count,
  COUNT(DISTINCT t.employee_ids) as employee_count,
  AVG(ARRAY_LENGTH(t.travelers, 1)) as avg_travelers
FROM public.sectors s
LEFT JOIN public.trips t ON t.sector = s.name
WHERE t.trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY s.name, s.id
ORDER BY trip_count DESC;

-- Criar view de estatísticas de veículos sem SECURITY DEFINER  
CREATE VIEW public.vehicle_statistics AS
SELECT 
  v.brand || ' ' || v.model as vehicle_name,
  v.plate,
  v.capacity,
  COUNT(t.id) as trip_count,
  ROUND(COUNT(t.id) * 100.0 / NULLIF(
    (SELECT COUNT(*) FROM public.trips WHERE vehicle_id IS NOT NULL), 0
  ), 2) as usage_percentage
FROM public.vehicles v
LEFT JOIN public.trips t ON t.vehicle_id = v.id
WHERE t.trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY v.id, v.brand, v.model, v.plate, v.capacity
ORDER BY trip_count DESC;