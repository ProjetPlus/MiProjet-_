
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS complained_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_event text;

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_message_id text,
  event_type text NOT NULL,
  recipient_email text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_provider_msg ON public.email_events(provider, provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider_id ON public.email_logs(provider, provider_id);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email_events"
  ON public.email_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
