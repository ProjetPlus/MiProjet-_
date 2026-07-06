
-- 1) Revoke EXECUTE on SECURITY DEFINER functions that should NOT be callable
-- directly by end users (they run inside triggers or from the service role).
REVOKE EXECUTE ON FUNCTION public.log_service_request_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_introduction_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_opportunity_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_lifetime_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_referrer_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_investor_user_type() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_user_type_permanent() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_ticket_quota() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mp_auto_publish_eligible_project() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pick_email_provider() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_email_provider_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_unsubscribed(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_payments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_agricapital_partition() FROM PUBLIC, anon;

-- 2) Prevent anonymous listing of public storage buckets. Public buckets still
-- serve individual files via their public URL, but a client cannot enumerate
-- the bucket contents through storage.objects.
DROP POLICY IF EXISTS "Deny anon listing of public media buckets" ON storage.objects;
CREATE POLICY "Deny anon listing of public media buckets"
ON storage.objects
AS RESTRICTIVE
FOR SELECT
TO anon
USING (bucket_id NOT IN ('news-media', 'project-media'));
