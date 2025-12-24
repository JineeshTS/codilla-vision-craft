-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create system_config table for app settings
CREATE TABLE public.system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (for feature flags)
CREATE POLICY "Anyone can read system config"
ON public.system_config
FOR SELECT
USING (true);

-- Only admins can update config
CREATE POLICY "Admins can update system config"
ON public.system_config
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert config
CREATE POLICY "Admins can insert system config"
ON public.system_config
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create announcements table for notifications
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_audience TEXT NOT NULL DEFAULT 'all',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));

-- Admins can manage all announcements
CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system configs
INSERT INTO public.system_config (config_key, config_value, description, category) VALUES
('ai_providers', '{"openai": true, "anthropic": true, "google": true}', 'Enable/disable AI providers', 'ai'),
('rate_limits', '{"requests_per_minute": 60, "tokens_per_day": 100000}', 'API rate limits', 'security'),
('feature_flags', '{"dark_mode": true, "github_integration": true, "templates": true}', 'Feature toggles', 'features'),
('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode settings', 'system'),
('token_packages', '[{"id": "starter", "tokens": 5000, "price": 99, "popular": false}, {"id": "pro", "tokens": 25000, "price": 399, "popular": true}, {"id": "enterprise", "tokens": 100000, "price": 999, "popular": false}]', 'Token package configuration', 'payments');