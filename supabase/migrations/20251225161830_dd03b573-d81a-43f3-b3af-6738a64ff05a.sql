-- Fix the payment_history view to use SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.payment_history;

CREATE VIEW public.payment_history 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.payment_reference,
  p.created_at,
  pr.title as project_title,
  sr.service_type
FROM public.payments p
LEFT JOIN public.projects pr ON p.project_id = pr.id
LEFT JOIN public.service_requests sr ON p.service_request_id = sr.id;