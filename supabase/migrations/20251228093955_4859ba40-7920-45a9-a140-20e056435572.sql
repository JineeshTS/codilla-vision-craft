-- Allow admins to view all ideas for moderation
CREATE POLICY "Admins can view all ideas for moderation"
ON public.ideas
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any idea for moderation
CREATE POLICY "Admins can update ideas for moderation"
ON public.ideas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));