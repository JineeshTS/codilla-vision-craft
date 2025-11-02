-- Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.idea_status AS ENUM ('draft', 'validating', 'validated', 'in_development', 'completed', 'archived');
CREATE TYPE public.phase_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE public.ai_agent AS ENUM ('claude', 'gemini', 'codex');
CREATE TYPE public.token_transaction_type AS ENUM ('purchase', 'consumption', 'refund', 'bonus');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_tokens INTEGER DEFAULT 0 NOT NULL,
  tokens_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT,
  target_audience TEXT,
  unique_value_proposition TEXT,
  status idea_status DEFAULT 'draft' NOT NULL,
  consensus_score INTEGER,
  validation_summary JSONB,
  tokens_spent INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  current_phase INTEGER DEFAULT 1 NOT NULL,
  progress_percentage INTEGER DEFAULT 0 NOT NULL,
  repository_url TEXT,
  deployment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create phases table
CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status phase_status DEFAULT 'pending' NOT NULL,
  claude_validation JSONB,
  gemini_validation JSONB,
  codex_validation JSONB,
  consensus_reached BOOLEAN DEFAULT FALSE,
  tokens_spent INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, phase_number)
);

ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- Create ai_validations table
CREATE TABLE public.ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE NOT NULL,
  agent ai_agent NOT NULL,
  validation_data JSONB NOT NULL,
  score INTEGER,
  feedback TEXT,
  tokens_consumed INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.ai_validations ENABLE ROW LEVEL SECURITY;

-- Create token_transactions table
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type token_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ideas
CREATE POLICY "Users can view own ideas"
  ON public.ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON public.ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON public.ideas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for phases
CREATE POLICY "Users can view phases of own projects"
  ON public.phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = phases.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage phases of own projects"
  ON public.phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = phases.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_validations
CREATE POLICY "Users can view validations of own project phases"
  ON public.ai_validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.phases
      JOIN public.projects ON projects.id = phases.project_id
      WHERE phases.id = ai_validations.phase_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for token_transactions
CREATE POLICY "Users can view own transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.token_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for templates
CREATE POLICY "Everyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = created_by);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON public.phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, total_tokens)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    100
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.token_transactions (user_id, transaction_type, amount, balance_after, description)
  VALUES (NEW.id, 'bonus', 100, 100, 'Welcome bonus tokens');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();