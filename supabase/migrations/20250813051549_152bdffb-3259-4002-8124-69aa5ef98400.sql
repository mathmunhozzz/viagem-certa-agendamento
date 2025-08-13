
-- 1) Tabela para relatos de viagem por funcionário
create table if not exists public.trip_reports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, employee_id)
);

-- Índices úteis
create index if not exists idx_trip_reports_trip_id on public.trip_reports(trip_id);
create index if not exists idx_trip_reports_employee_id on public.trip_reports(employee_id);

-- Habilitar RLS
alter table public.trip_reports enable row level security;

-- 2) Políticas de segurança

-- Visualizar: dono do relato, criador da viagem, admin/manager
create policy if not exists "View own or privileged trip reports"
on public.trip_reports
for select
using (
  has_role('admin'::app_role)
  or has_role('manager'::app_role)
  or exists (
    select 1
    from public.employees e
    where e.id = trip_reports.employee_id
      and e.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.trips t
    where t.id = trip_reports.trip_id
      and t.created_by = auth.uid()
  )
);

-- Inserir: funcionário cria seu relato se estiver na viagem; admin/manager podem inserir
create policy if not exists "Employees can create their own trip report for assigned trips"
on public.trip_reports
for insert
with check (
  has_role('admin'::app_role)
  or has_role('manager'::app_role)
  or (
    exists (
      select 1
      from public.employees e
      where e.id = trip_reports.employee_id
        and e.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.trips t
      where t.id = trip_reports.trip_id
        and (trip_reports.employee_id = any(t.employee_ids) or t.created_by = auth.uid())
    )
  )
);

-- Atualizar: funcionário atualiza seu relato na viagem; admin/manager podem atualizar
create policy if not exists "Employees can update their own trip report"
on public.trip_reports
for update
using (
  has_role('admin'::app_role)
  or has_role('manager'::app_role)
  or exists (
    select 1
    from public.employees e
    where e.id = trip_reports.employee_id
      and e.auth_user_id = auth.uid()
  )
)
with check (
  has_role('admin'::app_role)
  or has_role('manager'::app_role)
  or (
    exists (
      select 1
      from public.employees e
      where e.id = trip_reports.employee_id
        and e.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.trips t
      where t.id = trip_reports.trip_id
        and (trip_reports.employee_id = any(t.employee_ids) or t.created_by = auth.uid())
    )
  )
);

-- Deletar: apenas admin/manager
create policy if not exists "Admins and managers can delete trip reports"
on public.trip_reports
for delete
using (has_role('admin'::app_role) or has_role('manager'::app_role));

-- 3) Trigger para manter updated_at
drop trigger if exists on_trip_reports_updated on public.trip_reports;
create trigger on_trip_reports_updated
before update on public.trip_reports
for each row execute function public.update_updated_at_column();
