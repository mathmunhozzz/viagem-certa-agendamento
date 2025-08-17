
-- 1) Enum de status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE public.ticket_status AS ENUM ('pendente', 'em_analise', 'corrigido', 'negado');
  END IF;
END
$$;

-- 2) Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Tabela de tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  status        public.ticket_status NOT NULL DEFAULT 'pendente',
  priority      text DEFAULT 'media',
  created_by    uuid NOT NULL,             -- auth.uid() do criador (não FK para auth.users)
  assigned_to   uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  sector_id     uuid REFERENCES public.sectors(id)   ON DELETE SET NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  due_date      date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_tickets_status       ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_sector       ON public.tickets (sector_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to  ON public.tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by   ON public.tickets (created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at   ON public.tickets (created_at DESC);

-- 4) Tabela de comentários
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_user_id  uuid NOT NULL,   -- auth.uid() do autor (não FK para auth.users)
  message         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5) RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Tickets: SELECT (criador, responsável, admins/gerentes)
DROP POLICY IF EXISTS "Tickets visíveis para criador, responsável e admins/gestores" ON public.tickets;
CREATE POLICY "Tickets visíveis para criador, responsável e admins/gestores"
ON public.tickets
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = public.tickets.assigned_to
        AND e.auth_user_id = auth.uid()
    )
  )
);

-- Tickets: INSERT (somente se created_by = auth.uid())
DROP POLICY IF EXISTS "Usuários criam os próprios tickets" ON public.tickets;
CREATE POLICY "Usuários criam os próprios tickets"
ON public.tickets
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);

-- Tickets: UPDATE (criador, responsável, admins/gerentes)
DROP POLICY IF EXISTS "Atualização por criador, responsável e admins/gestores" ON public.tickets;
CREATE POLICY "Atualização por criador, responsável e admins/gestores"
ON public.tickets
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = public.tickets.assigned_to
        AND e.auth_user_id = auth.uid()
    )
  )
);

-- Tickets: DELETE (criador e admins/gerentes)
DROP POLICY IF EXISTS "Remoção por criador e admins/gestores" ON public.tickets;
CREATE POLICY "Remoção por criador e admins/gestores"
ON public.tickets
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR created_by = auth.uid()
  )
);

-- Comentários: SELECT (quem pode ver o ticket)
DROP POLICY IF EXISTS "Comentários visíveis a quem pode ver o ticket" ON public.ticket_comments;
CREATE POLICY "Comentários visíveis a quem pode ver o ticket"
ON public.ticket_comments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    LEFT JOIN public.employees e ON e.id = t.assigned_to
    WHERE t.id = public.ticket_comments.ticket_id
      AND (
        has_role('admin'::app_role)
        OR has_role('manager'::app_role)
        OR t.created_by = auth.uid()
        OR e.auth_user_id = auth.uid()
      )
  )
);

-- Comentários: INSERT (autor = auth.uid e pode ver o ticket)
DROP POLICY IF EXISTS "Inserir comentário se autor e com acesso ao ticket" ON public.ticket_comments;
CREATE POLICY "Inserir comentário se autor e com acesso ao ticket"
ON public.ticket_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND author_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    LEFT JOIN public.employees e ON e.id = t.assigned_to
    WHERE t.id = public.ticket_comments.ticket_id
      AND (
        has_role('admin'::app_role)
        OR has_role('manager'::app_role)
        OR t.created_by = auth.uid()
        OR e.auth_user_id = auth.uid()
      )
  )
);

-- Comentários: UPDATE (autor ou admins/gerentes)
DROP POLICY IF EXISTS "Atualizar comentário por autor ou admins/gestores" ON public.ticket_comments;
CREATE POLICY "Atualizar comentário por autor ou admins/gestores"
ON public.ticket_comments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR author_user_id = auth.uid()
  )
);

-- Comentários: DELETE (autor ou admins/gerentes)
DROP POLICY IF EXISTS "Remover comentário por autor ou admins/gestores" ON public.ticket_comments;
CREATE POLICY "Remover comentário por autor ou admins/gestores"
ON public.ticket_comments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR author_user_id = auth.uid()
  )
);
