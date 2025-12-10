-- Task 5: Fix Database Function Search Paths
-- Update handle_new_user function to include proper search_path

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, token_balance, total_tokens, tokens_used)
  VALUES (NEW.id, NEW.email, 10000, 10000, 0)
  ON CONFLICT (id) DO UPDATE
  SET token_balance = COALESCE(profiles.token_balance, 10000);
  RETURN NEW;
END;
$function$;