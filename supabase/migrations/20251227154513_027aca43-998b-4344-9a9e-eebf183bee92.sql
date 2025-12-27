-- Add status column to profiles for user suspension/ban functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'banned'));

-- Add moderation_status column to ideas for content moderation workflow
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending';

-- Add check constraint for valid moderation status values
ALTER TABLE public.ideas 
ADD CONSTRAINT ideas_moderation_status_check 
CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Add moderation metadata columns
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- Create index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_ideas_moderation_status ON public.ideas(moderation_status);