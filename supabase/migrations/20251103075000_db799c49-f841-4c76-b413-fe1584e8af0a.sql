-- Add token_balance column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS token_balance integer NOT NULL DEFAULT 0;

-- Update existing profiles to calculate token_balance from total_tokens - tokens_used
UPDATE public.profiles 
SET token_balance = total_tokens - tokens_used 
WHERE token_balance = 0;

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type text,
  context_id uuid,
  phase_number integer,
  messages jsonb DEFAULT '[]'::jsonb,
  total_tokens_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ai_conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON public.ai_conversations(context_type, context_id);