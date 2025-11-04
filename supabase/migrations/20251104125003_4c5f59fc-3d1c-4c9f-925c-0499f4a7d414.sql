-- Add new fields to ideas table for enhanced market research
ALTER TABLE public.ideas
ADD COLUMN IF NOT EXISTS target_geography TEXT,
ADD COLUMN IF NOT EXISTS estimated_market_size TEXT,
ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{"age_range": "", "gender": "", "income_level": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS psychographics TEXT,
ADD COLUMN IF NOT EXISTS competitive_landscape TEXT;

-- Add helpful comment
COMMENT ON COLUMN public.ideas.target_geography IS 'Target geographic market (e.g., USA, Europe, Global)';
COMMENT ON COLUMN public.ideas.estimated_market_size IS 'Estimated total addressable market size';
COMMENT ON COLUMN public.ideas.demographics IS 'Target audience demographics including age range, gender, and income level';
COMMENT ON COLUMN public.ideas.psychographics IS 'Target audience psychographics including interests, values, and lifestyle';
COMMENT ON COLUMN public.ideas.competitive_landscape IS 'Description of competitors and current solutions in the market';