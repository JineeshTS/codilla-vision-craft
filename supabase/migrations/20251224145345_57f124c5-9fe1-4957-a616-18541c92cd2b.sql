-- Allow service role and edge functions to insert into email_queue
CREATE POLICY "Service can insert emails"
  ON public.email_queue
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to update email queue status
CREATE POLICY "Admins can update email queue"
  ON public.email_queue
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete from email queue
CREATE POLICY "Admins can delete from email queue"
  ON public.email_queue
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));