-- Storage policy to allow viewing trip attachments via signed URLs
-- Allows: uploader (first folder = auth.uid()), admins, managers

-- Create SELECT policy on storage.objects for private bucket 'trip-attachments'
create policy if not exists "Trip attachments: view own or admin/manager"
on storage.objects
for select
using (
  bucket_id = 'trip-attachments'
  and (
    has_role('admin'::app_role)
    or has_role('manager'::app_role)
    or (auth.uid()::text = (storage.foldername(name))[1])
  )
);
