
-- Lot 1: enforce user_type and protect investor type when active subscription
ALTER TABLE public.profiles ALTER COLUMN user_type SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'individual';

CREATE OR REPLACE FUNCTION public.lock_investor_user_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_type = 'investor' AND NEW.user_type <> 'investor' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = OLD.id AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    ) THEN
      RAISE EXCEPTION 'Cannot change user_type from investor while subscription is active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_investor_user_type ON public.profiles;
CREATE TRIGGER trg_lock_investor_user_type
  BEFORE UPDATE OF user_type ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_investor_user_type();

-- Storage: add UPDATE policy on news-media for admins (allow replace)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admin can update news-media'
  ) THEN
    CREATE POLICY "Admin can update news-media" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'news-media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (bucket_id = 'news-media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can read news-media'
  ) THEN
    CREATE POLICY "Public can read news-media" ON storage.objects
      FOR SELECT USING (bucket_id = 'news-media');
  END IF;
END $$;
