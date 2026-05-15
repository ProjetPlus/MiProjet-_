
-- Restrict user_roles write policies to authenticated role only
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrict opportunity contact info to authenticated users:
-- replace the existing public SELECT policy with one that withholds rows from anonymous
-- only when contact_email/contact_phone are present? Simpler: keep row visible but
-- expose contact fields via a SECURITY INVOKER view, and revoke direct column access.
-- Most compatible fix: tighten policy so anonymous users cannot read rows
-- having non-null contact info OR restrict contact columns at column-level via GRANT.
REVOKE SELECT (contact_email, contact_phone) ON public.opportunities FROM anon;
GRANT SELECT (
  id, title, description, content, opportunity_type, category, status, is_active,
  is_featured, is_premium, published_at, author_id, author_name, eligibility,
  location, deadline, image_url, currency, amount_min, amount_max, external_link,
  views_count, short_slug, created_at, updated_at, send_by_email, email_segment,
  email_sent_at
) ON public.opportunities TO anon;

-- Allow users to self-unsubscribe (insert their own email)
CREATE POLICY "Anyone can self unsubscribe"
  ON public.email_unsubscribes FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND COALESCE(source, 'user') IN ('user','webhook','bounce','complaint')
  );

-- Allow admins to delete maintenance log entries (corrections), keep insert immutable
CREATE POLICY "Admins can delete maintenance log"
  ON public.maintenance_log FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
