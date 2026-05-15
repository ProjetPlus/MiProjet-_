
-- 1) Restreindre la policy permissive sur public.messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
CREATE POLICY "Public can submit valid messages"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    content IS NOT NULL
    AND length(btrim(content)) BETWEEN 1 AND 5000
    AND sender_name IS NOT NULL AND length(btrim(sender_name)) BETWEEN 2 AND 120
    AND sender_email IS NOT NULL
    AND sender_email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- 2) Révoquer EXECUTE sur toutes les SECURITY DEFINER publiques (triggers + helpers internes)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_referrer_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_lifetime_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_profile_type(uuid) FROM PUBLIC, anon, authenticated;

-- 3) Empêcher le listing des buckets publics : les fichiers restent servis via getPublicUrl
DROP POLICY IF EXISTS "Public read news-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
