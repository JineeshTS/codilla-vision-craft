-- Add restrictive RLS policies to ai_validations table
-- Only service role (edge functions) should be able to write validation records
-- Regular users should not be able to INSERT, UPDATE, or DELETE validations

-- Policy to deny INSERT for regular users (only service role can insert)
CREATE POLICY "Service role only can insert validations"
ON public.ai_validations
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy to deny UPDATE for regular users
CREATE POLICY "Service role only can update validations"
ON public.ai_validations
FOR UPDATE
TO authenticated
USING (false);

-- Policy to deny DELETE for regular users
CREATE POLICY "Service role only can delete validations"
ON public.ai_validations
FOR DELETE
TO authenticated
USING (false);