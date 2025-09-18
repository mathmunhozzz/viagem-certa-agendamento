-- Update the RLS policy to allow all approved users to view all trips
DROP POLICY IF EXISTS "Users can view trips based on role" ON public.trips;

CREATE POLICY "Users can view trips based on role" ON public.trips
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) 
  AND 
  (
    SELECT profiles.account_status
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) = 'approved'
);