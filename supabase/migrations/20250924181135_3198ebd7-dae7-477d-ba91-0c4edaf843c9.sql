-- Atualizar política RLS para permitir que admins façam upload de anexos
-- Remover política existente e criar nova que inclui admins
DROP POLICY IF EXISTS "Employees can upload attachments to their trips" ON public.trip_attachments;

-- Nova política que permite upload por funcionários OU admins/managers
CREATE POLICY "Employees and admins can upload trip attachments" 
ON public.trip_attachments 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND (
    -- Admins e managers podem sempre fazer upload
    (has_role('admin'::app_role) OR has_role('manager'::app_role)) OR
    -- OU funcionários podem fazer upload para suas viagens
    ((EXISTS ( SELECT 1 FROM employees e WHERE ((e.id = trip_attachments.employee_id) AND (e.auth_user_id = auth.uid())))) AND 
     (EXISTS ( SELECT 1 FROM trips t WHERE ((t.id = trip_attachments.trip_id) AND ((t.created_by = auth.uid()) OR (trip_attachments.employee_id = ANY (t.employee_ids))))))) 
  )
);