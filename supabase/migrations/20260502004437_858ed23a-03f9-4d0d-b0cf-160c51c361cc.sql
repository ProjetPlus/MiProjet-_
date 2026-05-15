-- Restore reliable admin detection without exposing arbitrary role checks
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated;

-- Ensure the two declared super admins keep their admin role idempotently
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE lower(u.email) IN ('innocentkoffi1@gmail.com', 'marcelkonan@ivoireprojet.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Keep profile classification coherent for admin dashboards only; roles remain authoritative in user_roles
UPDATE public.profiles p
SET user_type = 'admin'
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) IN ('innocentkoffi1@gmail.com', 'marcelkonan@ivoireprojet.com');