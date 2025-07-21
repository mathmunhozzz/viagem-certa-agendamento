
-- Criar tabela de setores
CREATE TABLE public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de funcionários
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relacionamento funcionário-setor (many-to-many)
CREATE TABLE public.employee_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, sector_id)
);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_sectors_updated_at 
  BEFORE UPDATE ON public.sectors 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON public.employees 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar nova coluna sector_id na tabela trips
ALTER TABLE public.trips ADD COLUMN sector_id UUID REFERENCES public.sectors(id);

-- Criar nova coluna employee_ids para armazenar IDs dos funcionários
ALTER TABLE public.trips ADD COLUMN employee_ids UUID[] DEFAULT '{}';

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sectors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sectors
CREATE POLICY "Authenticated users can view sectors" ON public.sectors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sectors" ON public.sectors FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sectors" ON public.sectors FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sectors" ON public.sectors FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas RLS para employees
CREATE POLICY "Authenticated users can view employees" ON public.employees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update employees" ON public.employees FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete employees" ON public.employees FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas RLS para employee_sectors
CREATE POLICY "Authenticated users can view employee_sectors" ON public.employee_sectors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create employee_sectors" ON public.employee_sectors FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update employee_sectors" ON public.employee_sectors FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete employee_sectors" ON public.employee_sectors FOR DELETE USING (auth.uid() IS NOT NULL);
