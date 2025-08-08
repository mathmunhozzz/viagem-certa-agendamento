-- Create storage bucket for trip attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-attachments', 'trip-attachments', false);

-- Create table for trip attachments
CREATE TABLE public.trip_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trip_attachments
ALTER TABLE public.trip_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for trip attachments
CREATE POLICY "Users can view trip attachments if they have access to the trip" 
ON public.trip_attachments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Employee can see their own attachments
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = trip_attachments.employee_id 
      AND employees.auth_user_id = auth.uid()
    )
    OR
    -- Admin/Manager can see all attachments
    has_role('admin'::app_role) OR has_role('manager'::app_role)
    OR
    -- Trip creator can see attachments
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_attachments.trip_id 
      AND trips.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Employees can upload attachments to their trips" 
ON public.trip_attachments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = trip_attachments.employee_id 
    AND employees.auth_user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = trip_attachments.trip_id 
    AND (
      trips.created_by = auth.uid() OR 
      auth.uid()::text = ANY(SELECT unnest(employee_ids)::text FROM trips WHERE id = trip_attachments.trip_id)
    )
  )
);

CREATE POLICY "Users can delete their own attachments" 
ON public.trip_attachments 
FOR DELETE 
USING (
  auth.uid() = uploaded_by OR 
  has_role('admin'::app_role) OR 
  has_role('manager'::app_role)
);

-- Storage policies for trip-attachments bucket
CREATE POLICY "Users can view trip attachments they have access to" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'trip-attachments' AND 
  auth.uid() IS NOT NULL AND (
    -- Check if user has access to this specific attachment
    EXISTS (
      SELECT 1 FROM trip_attachments ta
      JOIN employees e ON e.id = ta.employee_id
      WHERE ta.file_path = name AND (
        e.auth_user_id = auth.uid() OR
        has_role('admin'::app_role) OR 
        has_role('manager'::app_role)
      )
    )
  )
);

CREATE POLICY "Employees can upload trip attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'trip-attachments' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own trip attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'trip-attachments' AND 
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM trip_attachments ta
      WHERE ta.file_path = name AND ta.uploaded_by = auth.uid()
    ) OR
    has_role('admin'::app_role) OR 
    has_role('manager'::app_role)
  )
);