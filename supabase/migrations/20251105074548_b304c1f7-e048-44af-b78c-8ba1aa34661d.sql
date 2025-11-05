-- Give all existing users with 0 tokens an initial balance
UPDATE profiles 
SET token_balance = 10000 
WHERE token_balance = 0 OR token_balance IS NULL;

-- Create a function to give new users initial tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, token_balance, total_tokens, tokens_used)
  VALUES (NEW.id, 10000, 10000, 0)
  ON CONFLICT (id) DO UPDATE
  SET token_balance = COALESCE(profiles.token_balance, 10000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically give new users tokens
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();