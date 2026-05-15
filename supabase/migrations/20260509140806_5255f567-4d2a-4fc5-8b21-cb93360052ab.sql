REVOKE EXECUTE ON FUNCTION public.pick_email_provider() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_email_provider_usage(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pick_email_provider() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_email_provider_usage(text) TO service_role;