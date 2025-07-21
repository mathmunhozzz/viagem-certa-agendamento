
-- Criar tabela de veículos
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 5,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela vehicles
CREATE POLICY "Authenticated users can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Adicionar coluna vehicle_id na tabela trips
ALTER TABLE public.trips ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id);

-- Trigger para atualizar updated_at na tabela vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
