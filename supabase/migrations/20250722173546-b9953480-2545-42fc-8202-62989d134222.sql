-- Adicionar campo de observação na tabela trips
ALTER TABLE public.trips 
ADD COLUMN observations TEXT;