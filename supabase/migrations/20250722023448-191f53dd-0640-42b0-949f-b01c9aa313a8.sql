-- Add account status to profiles table
ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'rejected'));

-- Update existing profiles to approved status
UPDATE public.profiles SET account_status = 'approved';

-- Update RLS policies to only allow approved users to access the app
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;

CREATE POLICY "Users can view relevant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.uid())::text = (user_id)::text) OR 
    has_role('admin'::app_role) OR 
    has_role('manager'::app_role)
  )
);

-- Only approved users can access other tables
DROP POLICY IF EXISTS "Users can view trips based on role" ON public.trips;
CREATE POLICY "Users can view trips based on role" 
ON public.trips 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    SELECT account_status FROM public.profiles WHERE user_id = auth.uid()
  ) = 'approved' AND
  (
    has_role('admin'::app_role) OR 
    has_role('manager'::app_role) OR 
    ((auth.uid())::text = (created_by)::text) OR 
    ((auth.uid())::text = ANY ((employee_ids)::text[]))
  )
);

-- Update other table policies to require approved status
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
CREATE POLICY "Authenticated users can view employees" 
ON public.employees 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    SELECT account_status FROM public.profiles WHERE user_id = auth.uid()
  ) = 'approved'
);

DROP POLICY IF EXISTS "Authenticated users can view sectors" ON public.sectors;
CREATE POLICY "Authenticated users can view sectors" 
ON public.sectors 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    SELECT account_status FROM public.profiles WHERE user_id = auth.uid()
  ) = 'approved'
);

DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    SELECT account_status FROM public.profiles WHERE user_id = auth.uid()
  ) = 'approved'
);

-- Create policy for admins to manage user approval
CREATE POLICY "Admins can update user approval status" 
ON public.profiles 
FOR UPDATE 
USING (has_role('admin'::app_role));

-- Create policy for admins to manage user roles  
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role('admin'::app_role));

CREATE POLICY "Admins can insert any role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role('admin'::app_role));