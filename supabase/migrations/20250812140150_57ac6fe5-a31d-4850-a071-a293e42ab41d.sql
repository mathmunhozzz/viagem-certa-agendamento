
-- 1) Remover políticas de SELECT anteriores conflitantes no Storage
drop policy if exists "Trip attachments: view own or admin/manager" on storage.objects;
drop policy if exists "Users can view trip attachments they have access to" on storage.objects;

-- 2) Criar política única e clara de SELECT para permitir gerar links assinados
create policy "Trip attachments: view if related to your trip or role"
on storage.objects
for select
using (
  bucket_id = 'trip-attachments'
  and auth.uid() is not null
  and exists (
    select 1
    from public.trip_attachments ta
    left join public.employees e on e.id = ta.employee_id
    left join public.trips t on t.id = ta.trip_id
    where ta.file_path = storage.objects.name
      and (
        -- quem enviou o anexo
        ta.uploaded_by = auth.uid()
        -- funcionário (usuário) vinculado ao anexo
        or e.auth_user_id = auth.uid()
        -- criador da viagem
        or t.created_by = auth.uid()
        -- admins e managers
        or has_role('admin'::app_role)
        or has_role('manager'::app_role)
      )
  )
);
