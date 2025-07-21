-- Limpar viagens que tenham funcionários duplicados no campo travelers
UPDATE public.trips 
SET travelers = ARRAY[]::text[] 
WHERE array_length(employee_ids, 1) > 0;