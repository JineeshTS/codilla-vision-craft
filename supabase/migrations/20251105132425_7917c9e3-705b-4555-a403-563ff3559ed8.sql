-- Create artifact_versions table for version history
CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.phase_artifacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  artifact_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT,
  is_auto_save BOOLEAN DEFAULT false,
  UNIQUE(artifact_id, version_number)
);

-- Enable RLS
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view versions of their project artifacts"
  ON public.artifact_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifact_versions.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their project artifacts"
  ON public.artifact_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifact_versions.project_id
        AND projects.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can delete versions of their project artifacts"
  ON public.artifact_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifact_versions.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id ON public.artifact_versions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_created_at ON public.artifact_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_project_id ON public.artifact_versions(project_id);

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_artifact_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.artifact_versions
  WHERE artifact_id = p_artifact_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;