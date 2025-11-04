-- Add business_research_data column to ideas table
ALTER TABLE public.ideas 
ADD COLUMN business_research_data JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.ideas.business_research_data IS 'Stores editable business research document data including all business model frameworks';