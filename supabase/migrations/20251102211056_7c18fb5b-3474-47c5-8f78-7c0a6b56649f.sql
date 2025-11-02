-- Add database indexes for improved query performance

-- Ideas table indexes
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);

-- Projects table indexes  
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_idea_id ON public.projects(idea_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Phases table indexes
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON public.phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON public.phases(status);
CREATE INDEX IF NOT EXISTS idx_phases_phase_number ON public.phases(phase_number);

-- Token transactions table indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(transaction_type);

-- AI validations table indexes
CREATE INDEX IF NOT EXISTS idx_ai_validations_phase_id ON public.ai_validations(phase_id);
CREATE INDEX IF NOT EXISTS idx_ai_validations_agent ON public.ai_validations(agent);
CREATE INDEX IF NOT EXISTS idx_ai_validations_created_at ON public.ai_validations(created_at DESC);

-- Templates table indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);

-- User roles table indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);