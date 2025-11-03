-- Development Prompts Table (Phase 6: Development Preparation)
CREATE TABLE public.development_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'setup', 'feature', 'integration', 'testing', 'deployment'
  dependencies TEXT[], -- Array of prompt IDs that must be executed first
  estimated_tokens INTEGER NOT NULL DEFAULT 5000,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed', 'skipped'
  execution_result TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dev_prompts_project ON public.development_prompts(project_id);
CREATE INDEX idx_dev_prompts_status ON public.development_prompts(status);
CREATE INDEX idx_dev_prompts_sequence ON public.development_prompts(project_id, sequence_number);

-- Change Requests Table (Tracks all user-requested changes)
CREATE TABLE public.change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_analysis TEXT,
  affected_components TEXT[],
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'analyzing', 'approved', 'rejected', 'implemented'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  user_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cr_project ON public.change_requests(project_id);
CREATE INDEX idx_cr_status ON public.change_requests(status);
CREATE INDEX idx_cr_user ON public.change_requests(user_id);

-- Prompt Executions Table (Tracks each prompt execution with preview)
CREATE TABLE public.prompt_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.development_prompts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  execution_order INTEGER NOT NULL,
  generated_code TEXT,
  preview_url TEXT,
  user_feedback TEXT,
  user_approved BOOLEAN DEFAULT false,
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exec_prompt ON public.prompt_executions(prompt_id);
CREATE INDEX idx_exec_project ON public.prompt_executions(project_id);
CREATE INDEX idx_exec_order ON public.prompt_executions(project_id, execution_order);

-- Enable RLS
ALTER TABLE public.development_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for development_prompts
CREATE POLICY "Users can view prompts for their projects"
ON public.development_prompts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = development_prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert prompts for their projects"
ON public.development_prompts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = development_prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update prompts for their projects"
ON public.development_prompts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = development_prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- RLS Policies for change_requests
CREATE POLICY "Users can view their change requests"
ON public.change_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create change requests"
ON public.change_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their change requests"
ON public.change_requests FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for prompt_executions
CREATE POLICY "Users can view executions for their projects"
ON public.prompt_executions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompt_executions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert executions for their projects"
ON public.prompt_executions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompt_executions.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dev_prompts_updated_at
BEFORE UPDATE ON public.development_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_change_requests_updated_at
BEFORE UPDATE ON public.change_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();