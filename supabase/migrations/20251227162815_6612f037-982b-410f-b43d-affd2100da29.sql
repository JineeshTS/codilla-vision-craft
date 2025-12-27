-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags (needed for frontend checks)
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Only admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index
CREATE INDEX idx_feature_flags_category ON public.feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(is_enabled);

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_key, name, description, category, is_enabled) VALUES
  ('ai_consensus', 'AI Consensus Validation', 'Enable multi-AI consensus for idea validation', 'ai', true),
  ('github_integration', 'GitHub Integration', 'Allow users to connect GitHub repositories', 'integrations', true),
  ('token_purchases', 'Token Purchases', 'Enable token purchase functionality', 'billing', true),
  ('email_notifications', 'Email Notifications', 'Send email notifications to users', 'notifications', true),
  ('maintenance_mode', 'Maintenance Mode', 'Put the platform in maintenance mode', 'system', false),
  ('new_user_registration', 'New User Registration', 'Allow new users to register', 'system', true);