-- Fix critical database function security issues
-- 1. Update handle_new_user function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update update_updated_at_column function with proper security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block updates if timestamp fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create user roles system for proper access control
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 5. Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 6. Add role column to profiles for easier access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'user';

-- 7. Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Only allow users to view profiles in same organization or if they're admin/manager
CREATE POLICY "Users can view relevant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can view their own profile
    auth.uid()::text = user_id::text OR
    -- Admins can view all profiles
    public.has_role('admin'::app_role) OR
    -- Managers can view all profiles (could be restricted further based on organization)
    public.has_role('manager'::app_role)
  )
);

-- 8. Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role('admin'::app_role));

CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text AND role = 'user'::app_role);

-- 9. Update trips RLS policies for better security
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can update trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can delete trips" ON public.trips;

-- More restrictive trip viewing policy
CREATE POLICY "Users can view trips based on role" 
ON public.trips 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins and managers can view all trips
    public.has_role('admin'::app_role) OR
    public.has_role('manager'::app_role) OR
    -- Regular users can view trips they created or are assigned to
    auth.uid()::text = created_by::text OR
    auth.uid()::text = ANY(employee_ids::text[])
  )
);

-- Restrict trip updates to creators, assigned employees, and managers
CREATE POLICY "Users can update relevant trips" 
ON public.trips 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role('admin'::app_role) OR
    public.has_role('manager'::app_role) OR
    auth.uid()::text = created_by::text
  )
);

-- Restrict trip deletion to admins and managers
CREATE POLICY "Admins and managers can delete trips" 
ON public.trips 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role('admin'::app_role) OR
    public.has_role('manager'::app_role)
  )
);

-- 10. Add constraints for better data validation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_name_not_empty CHECK (char_length(trim(name)) > 0);

ALTER TABLE public.trips 
ADD CONSTRAINT trips_title_not_empty CHECK (char_length(trim(title)) > 0),
ADD CONSTRAINT trips_date_not_past CHECK (trip_date >= CURRENT_DATE - INTERVAL '1 day');

ALTER TABLE public.sectors 
ADD CONSTRAINT sectors_name_not_empty CHECK (char_length(trim(name)) > 0);

ALTER TABLE public.employees 
ADD CONSTRAINT employees_name_not_empty CHECK (char_length(trim(name)) > 0);

ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_plate_not_empty CHECK (char_length(trim(plate)) > 0),
ADD CONSTRAINT vehicles_capacity_positive CHECK (capacity > 0);

-- 11. Create trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Function to automatically assign default role when user signs up
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = 'user'::app_role 
  WHERE user_id = NEW.user_id AND role IS NULL;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block profile creation if role assignment fails
    RAISE WARNING 'Failed to assign default role for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to assign default role after profile creation
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();