-- Criar tabela para ausências de funcionários
CREATE TABLE public.employee_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

-- Funcionários podem ver e criar suas próprias ausências
CREATE POLICY "Employees can view their own absences" 
ON public.employee_absences 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_absences.employee_id 
    AND e.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Employees can create their own absences" 
ON public.employee_absences 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_absences.employee_id 
    AND e.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their own pending absences" 
ON public.employee_absences 
FOR UPDATE 
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_absences.employee_id 
    AND e.auth_user_id = auth.uid()
  )
);

-- Admins podem ver e gerenciar todas as ausências
CREATE POLICY "Admins can manage all absences" 
ON public.employee_absences 
FOR ALL 
USING (has_role('admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_employee_absences_updated_at
BEFORE UPDATE ON public.employee_absences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();