-- Adicionar coluna system_name na tabela backup_requests
ALTER TABLE public.backup_requests 
ADD COLUMN system_name text;