-- Create payment_transactions table for Razorpay integration
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  tokens_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_transactions
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
  ON public.payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add Phase 2 columns to ideas table
ALTER TABLE public.ideas 
  ADD COLUMN IF NOT EXISTS phase_2_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_validation_score INTEGER,
  ADD COLUMN IF NOT EXISTS phase_2_decision TEXT CHECK (phase_2_decision IN ('go', 'pivot', 'kill')),
  ADD COLUMN IF NOT EXISTS phase_2_completed_at TIMESTAMP WITH TIME ZONE;

-- Add Phase 3 columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS prd_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_personas JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS mvp_features JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS user_stories JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS phase_3_completed_at TIMESTAMP WITH TIME ZONE;

-- Add trigger for payment_transactions updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id ON public.payment_transactions(razorpay_order_id);