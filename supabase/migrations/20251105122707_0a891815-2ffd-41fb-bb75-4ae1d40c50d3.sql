-- Add active user tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient active user queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at);

-- Create function to update last_active_at
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only update if more than 5 minutes have passed since last update
  -- This prevents excessive writes
  IF (NEW.last_active_at IS NULL OR 
      NEW.last_active_at < now() - INTERVAL '5 minutes') THEN
    NEW.last_active_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-update last_active_at
DROP TRIGGER IF EXISTS trigger_update_last_active ON public.profiles;
CREATE TRIGGER trigger_update_last_active
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active();

-- Update existing function to set search_path for security (using CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Recreate the RLS policy that depends on has_role
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);