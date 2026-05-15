
-- 1) Newsletter subscribers: add full_name + unsubscribe_token
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

UPDATE public.newsletter_subscribers
  SET unsubscribe_token = replace(gen_random_uuid()::text, '-', '')
  WHERE unsubscribe_token IS NULL;

-- 2) Profiles: add unsubscribe_token (for transactional opt-outs)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

UPDATE public.profiles
  SET unsubscribe_token = replace(gen_random_uuid()::text, '-', '')
  WHERE unsubscribe_token IS NULL;

-- 3) Global unsubscribe table (one row per opted-out email)
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  source text DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view unsubscribes"
  ON public.email_unsubscribes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert unsubscribes"
  ON public.email_unsubscribes FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON public.email_unsubscribes (lower(email));

-- 4) News + Opportunities: send-by-email + segment fields
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS send_by_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_segment text DEFAULT 'newsletter',
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS send_by_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_segment text DEFAULT 'newsletter',
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

-- 5) Helper function: check if an email is unsubscribed
CREATE OR REPLACE FUNCTION public.is_email_unsubscribed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.email_unsubscribes WHERE lower(email) = lower(_email)
  );
$$;
