-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to auto-create notification on low token balance
CREATE OR REPLACE FUNCTION notify_low_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token_balance < 1000 AND OLD.token_balance >= 1000 THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.id,
      'Low Token Balance',
      'Your token balance is running low. Consider topping up to continue using AI features.',
      'warning',
      '/tokens'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_low_token_balance
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_token_balance();