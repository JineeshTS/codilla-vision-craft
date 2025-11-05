-- Add the first user (by creation date) as an admin
-- This gives the initial user admin privileges to access the Analytics page

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;