-- Fix INSERT RLS policy for trip_attachments to correctly validate trip membership by employee_id
DROP POLICY IF EXISTS "Employees can upload attachments to their trips" ON public.trip_attachments;

CREATE POLICY "Employees can upload attachments to their trips"
ON public.trip_attachments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = trip_attachments.employee_id
      AND e.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = trip_attachments.trip_id
      AND (
        t.created_by = auth.uid()
        OR trip_attachments.employee_id = ANY (t.employee_ids)
      )
  )
);
