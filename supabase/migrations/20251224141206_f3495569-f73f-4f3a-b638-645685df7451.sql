-- Create enquiries table
CREATE TABLE public.enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Public can submit enquiries (no auth required)
CREATE POLICY "Anyone can submit enquiries"
ON public.enquiries
FOR INSERT
WITH CHECK (true);

-- Only admins can view all enquiries
CREATE POLICY "Admins can view all enquiries"
ON public.enquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update enquiries
CREATE POLICY "Admins can update enquiries"
ON public.enquiries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete enquiries
CREATE POLICY "Admins can delete enquiries"
ON public.enquiries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_enquiries_updated_at
BEFORE UPDATE ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();