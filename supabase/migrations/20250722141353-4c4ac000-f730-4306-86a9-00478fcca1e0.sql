-- Corrigir a política RLS para trips para permitir que funcionários vejam suas viagens
DROP POLICY IF EXISTS "Users can view trips based on role" ON public.trips;

CREATE POLICY "Users can view trips based on role" 
ON public.trips 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    SELECT profiles.account_status
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) = 'approved'::text
  AND (
    has_role('admin'::app_role) 
    OR has_role('manager'::app_role) 
    OR (auth.uid())::text = (created_by)::text 
    OR EXISTS (
      SELECT 1 
      FROM employees 
      WHERE employees.auth_user_id = auth.uid() 
      AND employees.id = ANY(employee_ids)
    )
  )
);