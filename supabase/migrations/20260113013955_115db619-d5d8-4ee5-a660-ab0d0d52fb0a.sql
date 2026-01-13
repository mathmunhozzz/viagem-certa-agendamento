-- Create backup_requests table
CREATE TABLE public.backup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city_name text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_observation text,
  download_link text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own backup requests
CREATE POLICY "Users can create their own backup requests"
ON public.backup_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own backup requests
CREATE POLICY "Users can view their own backup requests"
ON public.backup_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all backup requests
CREATE POLICY "Admins can view all backup requests"
ON public.backup_requests
FOR SELECT
USING (has_role('admin'::app_role));

-- Admins can update any backup request
CREATE POLICY "Admins can update backup requests"
ON public.backup_requests
FOR UPDATE
USING (has_role('admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_backup_requests_updated_at
BEFORE UPDATE ON public.backup_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();