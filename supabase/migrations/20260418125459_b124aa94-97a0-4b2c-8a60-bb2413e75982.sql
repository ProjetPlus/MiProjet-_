
DROP VIEW IF EXISTS public.v_admin_payments;

CREATE OR REPLACE FUNCTION public.get_admin_payments()
RETURNS TABLE (
  id uuid, user_id uuid, amount numeric, currency text,
  payment_method text, payment_reference text, status text,
  created_at timestamptz, updated_at timestamptz, metadata jsonb,
  first_name text, last_name text, email text, phone text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT p.id, p.user_id, p.amount, p.currency, p.payment_method,
         p.payment_reference, p.status, p.created_at, p.updated_at, p.metadata,
         pr.first_name, pr.last_name, pr.email, pr.phone
  FROM public.payments p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;
