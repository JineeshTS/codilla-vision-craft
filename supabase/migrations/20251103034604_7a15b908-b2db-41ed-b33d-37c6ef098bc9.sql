-- Add template selection to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS selected_template_id UUID REFERENCES public.templates(id),
ADD COLUMN IF NOT EXISTS phase_5_completed_at TIMESTAMPTZ;