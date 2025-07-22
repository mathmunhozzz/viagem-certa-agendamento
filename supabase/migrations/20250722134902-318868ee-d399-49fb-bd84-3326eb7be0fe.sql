-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  municipality TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela clients
CREATE POLICY "Authenticated users can view clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (
  SELECT profiles.account_status
  FROM profiles
  WHERE profiles.user_id = auth.uid()
) = 'approved');

CREATE POLICY "Authenticated users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Adicionar coluna client_id na tabela trips
ALTER TABLE public.trips 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Adicionar coluna email na tabela employees para vincular com auth
ALTER TABLE public.employees 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Trigger para atualizar updated_at na tabela clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_trips_client_id ON public.trips(client_id);
CREATE INDEX idx_employees_auth_user_id ON public.employees(auth_user_id);