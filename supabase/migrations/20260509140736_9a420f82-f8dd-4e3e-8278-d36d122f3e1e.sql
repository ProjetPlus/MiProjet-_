CREATE TABLE IF NOT EXISTS public.email_provider_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('brevo','resend')),
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  sent_count integer NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, usage_date)
);

ALTER TABLE public.email_provider_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email provider usage"
  ON public.email_provider_usage
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_email_provider_usage_updated_at
  BEFORE UPDATE ON public.email_provider_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider text;

CREATE OR REPLACE FUNCTION public.pick_email_provider()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  brevo_used integer;
  resend_used integer;
BEGIN
  SELECT COALESCE(sent_count,0) INTO brevo_used FROM public.email_provider_usage WHERE provider='brevo' AND usage_date=CURRENT_DATE;
  SELECT COALESCE(sent_count,0) INTO resend_used FROM public.email_provider_usage WHERE provider='resend' AND usage_date=CURRENT_DATE;
  brevo_used := COALESCE(brevo_used,0);
  resend_used := COALESCE(resend_used,0);
  IF brevo_used < 300 THEN RETURN 'brevo';
  ELSIF resend_used < 100 THEN RETURN 'resend';
  ELSE RETURN NULL; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_email_provider_usage(_provider text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_count integer;
  _limit integer;
BEGIN
  IF _provider NOT IN ('brevo','resend') THEN RAISE EXCEPTION 'Invalid provider: %', _provider; END IF;
  _limit := CASE WHEN _provider='brevo' THEN 300 ELSE 100 END;
  INSERT INTO public.email_provider_usage (provider, usage_date, sent_count, daily_limit)
  VALUES (_provider, CURRENT_DATE, 1, _limit)
  ON CONFLICT (provider, usage_date)
  DO UPDATE SET sent_count = public.email_provider_usage.sent_count + 1, updated_at = now()
  RETURNING sent_count INTO new_count;
  RETURN new_count;
END; $$;

UPDATE public.newsletter_subscribers SET is_active = true, unsubscribed_at = NULL
  WHERE is_active = false AND unsubscribed_at IS NULL;