-- Add GitHub integration fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS github_token TEXT,
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS github_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS selected_github_repo TEXT;

-- Create UI templates table for reusable components
CREATE TABLE IF NOT EXISTS ui_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  component_code TEXT,
  tailwind_config JSONB,
  dependencies JSONB,
  customizable_fields JSONB,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ui_templates
ALTER TABLE ui_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for ui_templates
CREATE POLICY "Public templates are viewable by everyone"
  ON ui_templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own templates"
  ON ui_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON ui_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON ui_templates FOR DELETE
  USING (auth.uid() = created_by);

-- Create code commits tracking table
CREATE TABLE IF NOT EXISTS code_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  phase_number INTEGER,
  task_id TEXT,
  github_repo TEXT NOT NULL,
  file_path TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  commit_url TEXT NOT NULL,
  commit_message TEXT,
  code_content TEXT,
  optimized_for_lovable BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on code_commits
ALTER TABLE code_commits ENABLE ROW LEVEL SECURITY;

-- RLS policies for code_commits
CREATE POLICY "Users can view their own commits"
  ON code_commits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commits"
  ON code_commits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at on ui_templates
CREATE OR REPLACE FUNCTION update_ui_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ui_templates_updated_at_trigger
  BEFORE UPDATE ON ui_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_templates_updated_at();