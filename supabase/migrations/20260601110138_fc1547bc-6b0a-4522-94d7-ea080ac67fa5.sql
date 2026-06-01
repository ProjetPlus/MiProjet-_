
-- 1. Hide contact_email/contact_phone from anon on opportunities (column-level)
REVOKE SELECT (contact_email, contact_phone) ON public.opportunities FROM anon;

-- 2. RPC to access contacts safely (authenticated only)
CREATE OR REPLACE FUNCTION public.get_opportunity_contacts(p_id uuid)
RETURNS TABLE(contact_email text, contact_phone text, external_link text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  RETURN QUERY
  SELECT o.contact_email, o.contact_phone, o.external_link
  FROM public.opportunities o
  WHERE o.id = p_id
    AND o.status = 'published'
    AND COALESCE(o.is_active, true) = true
    AND (
      COALESCE(o.is_premium, false) = false
      OR public.has_active_subscription(auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_opportunity_contacts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_opportunity_contacts(uuid) TO authenticated;

-- 3. Lock down SECURITY DEFINER functions that should not be callable by clients
REVOKE EXECUTE ON FUNCTION public.pick_email_provider() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_email_provider_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_lifetime_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_referrer_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_opportunity_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_investor_user_type() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 4. Restrict listing of news-media bucket while keeping public file URLs accessible via CDN
DROP POLICY IF EXISTS "Public can read news-media" ON storage.objects;
CREATE POLICY "Authenticated can list news-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'news-media');
