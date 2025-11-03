-- Add task_outputs column to phase_progress table
ALTER TABLE phase_progress 
ADD COLUMN IF NOT EXISTS task_outputs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS completed_tasks JSONB DEFAULT '[]'::jsonb;

-- Create phase_artifacts table to store outputs from each task
CREATE TABLE IF NOT EXISTS phase_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL, -- 'prd', 'design', 'code', 'analysis', 'framework', etc.
  artifact_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on phase_artifacts
ALTER TABLE phase_artifacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phase_artifacts
CREATE POLICY "Users can view artifacts of their projects"
  ON phase_artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert artifacts for their projects"
  ON phase_artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update artifacts of their projects"
  ON phase_artifacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete artifacts of their projects"
  ON phase_artifacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phase_artifacts_project_phase 
  ON phase_artifacts(project_id, phase_number);

CREATE INDEX IF NOT EXISTS idx_phase_artifacts_task 
  ON phase_artifacts(project_id, phase_number, task_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_phase_artifacts_updated_at
  BEFORE UPDATE ON phase_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();