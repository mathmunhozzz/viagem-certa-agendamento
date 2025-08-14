-- Create trip_reports table for employee trip narratives
CREATE TABLE public.trip_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, employee_id)
);

-- Enable Row Level Security
ALTER TABLE public.trip_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for trip reports
CREATE POLICY "Employees can view their own trip reports" 
ON public.trip_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = trip_reports.employee_id 
    AND employees.auth_user_id = auth.uid()
  )
  OR has_role('admin'::app_role) 
  OR has_role('manager'::app_role)
);

CREATE POLICY "Employees can create their own trip reports" 
ON public.trip_reports 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = trip_reports.employee_id 
    AND employees.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = trip_reports.trip_id 
    AND trip_reports.employee_id = ANY(trips.employee_ids)
  )
);

CREATE POLICY "Employees can update their own trip reports" 
ON public.trip_reports 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = trip_reports.employee_id 
    AND employees.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Employees can delete their own trip reports" 
ON public.trip_reports 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = trip_reports.employee_id 
    AND employees.auth_user_id = auth.uid()
  )
  OR has_role('admin'::app_role) 
  OR has_role('manager'::app_role)
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_trip_reports_updated_at
BEFORE UPDATE ON public.trip_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();