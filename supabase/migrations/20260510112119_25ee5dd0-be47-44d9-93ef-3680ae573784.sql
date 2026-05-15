
REVOKE EXECUTE ON FUNCTION public.is_email_unsubscribed(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_unsubscribed(text) TO service_role;
