-- Add missing fields and tables for complete Codilla Framework

-- Update ideas table with additional Phase 1 fields
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS business_model TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS audience_size TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS inspiration_source TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS current_solutions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS key_differentiator TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS expected_outcomes JSONB;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS passion_score INTEGER;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS domain_knowledge_score INTEGER;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS screening_score INTEGER;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS decision_status TEXT DEFAULT 'pending';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1;

-- Create phase_progress table
CREATE TABLE IF NOT EXISTS public.phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  progress NUMERIC DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stages JSONB DEFAULT '[]'::jsonb,
  ai_decision TEXT,
  ai_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, phase_number)
);

-- Enable RLS on phase_progress
ALTER TABLE public.phase_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phase progress"
  ON public.phase_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = phase_progress.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own phase progress"
  ON public.phase_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = phase_progress.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own phase progress"
  ON public.phase_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = phase_progress.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create ai_requests table for tracking AI interactions
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  phase_id UUID REFERENCES public.phase_progress(id),
  idea_id UUID REFERENCES public.ideas(id),
  ai_agent TEXT NOT NULL,
  request_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER DEFAULT 0,
  execution_time INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_requests
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI requests"
  ON public.ai_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI requests"
  ON public.ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create reusable_templates table
CREATE TABLE IF NOT EXISTS public.reusable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  dependencies JSONB DEFAULT '[]'::jsonb,
  tokens_saved INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make templates publicly readable (everyone can use templates)
ALTER TABLE public.reusable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by authenticated users"
  ON public.reusable_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_phase_progress_project ON public.phase_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_progress_status ON public.phase_progress(status);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON public.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created ON public.ai_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.reusable_templates(category);

-- Create trigger for updating phase_progress updated_at
CREATE TRIGGER update_phase_progress_updated_at
  BEFORE UPDATE ON public.phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.reusable_templates (name, category, description, code, tokens_saved) VALUES
  ('Authentication Flow', 'AUTH', 'Complete user authentication with login, signup, and password reset', '// Template code here', 5000),
  ('Admin Dashboard', 'ADMIN', 'Full-featured admin panel with user management', '// Template code here', 8000),
  ('Payment Integration', 'PAYMENT', 'Stripe payment integration with subscriptions', '// Template code here', 6000),
  ('CRUD Operations', 'CRUD', 'Standard Create, Read, Update, Delete operations', '// Template code here', 3000),
  ('REST API Setup', 'API', 'RESTful API with authentication and validation', '// Template code here', 4000)
ON CONFLICT DO NOTHING;