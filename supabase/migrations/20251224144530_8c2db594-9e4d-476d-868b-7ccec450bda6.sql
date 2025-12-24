-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage email templates
CREATE POLICY "Admins can view email templates"
  ON public.email_templates
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view email queue
CREATE POLICY "Admins can view email queue"
  ON public.email_queue
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default email templates
INSERT INTO public.email_templates (template_key, name, subject, html_body, text_body) VALUES
('enquiry_response', 'Enquiry Response', 'Re: {{subject}}', 
  '<h2>Hello {{name}},</h2><p>Thank you for contacting us.</p><p>{{response}}</p><p>Best regards,<br>The Codilla.ai Team</p>',
  'Hello {{name}},\n\nThank you for contacting us.\n\n{{response}}\n\nBest regards,\nThe Codilla.ai Team'),
('welcome', 'Welcome Email', 'Welcome to Codilla.ai!',
  '<h2>Welcome to Codilla.ai, {{name}}!</h2><p>We are excited to have you on board. You have received {{tokens}} free tokens to get started.</p><p>Start building your ideas today!</p>',
  'Welcome to Codilla.ai, {{name}}!\n\nWe are excited to have you on board. You have received {{tokens}} free tokens to get started.\n\nStart building your ideas today!'),
('low_tokens', 'Low Token Balance', 'Your token balance is running low',
  '<h2>Hi {{name}},</h2><p>Your token balance is running low ({{balance}} tokens remaining).</p><p>Top up now to continue using AI features without interruption.</p>',
  'Hi {{name}},\n\nYour token balance is running low ({{balance}} tokens remaining).\n\nTop up now to continue using AI features without interruption.')
ON CONFLICT (template_key) DO NOTHING;