
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_opportunity_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text := 'https://nrrgqnruoylwztddkntm.supabase.co/functions/v1/notify-new-opportunity';
  _became_published boolean;
BEGIN
  _became_published := (NEW.status = 'published')
    AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, '') <> 'published');
  IF _became_published THEN
    PERFORM extensions.http_post(
      url := _url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('opportunityId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunity_published_notify ON public.opportunities;

CREATE TRIGGER trg_opportunity_published_notify
AFTER INSERT OR UPDATE OF status ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.notify_opportunity_published();
