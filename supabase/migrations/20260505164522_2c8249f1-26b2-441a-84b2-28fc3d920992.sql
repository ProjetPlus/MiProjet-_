
-- 1) FAQs: restrict public SELECT to is_active=true, admins see all
DROP POLICY IF EXISTS "Active FAQs are viewable by everyone" ON public.faqs;

CREATE POLICY "Active FAQs are viewable by everyone"
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (COALESCE(is_active, false) = true);

CREATE POLICY "Admins can view all FAQs"
ON public.faqs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Leads: consolidate INSERT policies
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
  END LOOP;
END $$;

-- Anonymous lead capture: no owner, validated fields, restricted sources
CREATE POLICY "Anon can submit public leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND email IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(email) <= 255
  AND first_name IS NOT NULL
  AND char_length(btrim(first_name)) BETWEEN 1 AND 120
  AND (last_name IS NULL OR char_length(btrim(last_name)) <= 120)
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (whatsapp IS NULL OR char_length(whatsapp) <= 40)
  AND (country IS NULL OR char_length(country) <= 120)
  AND (city IS NULL OR char_length(city) <= 120)
  AND COALESCE(lead_source, 'general') IN (
    'general','signup','contact','newsletter','document','opportunity',
    'project','subscription','event','training','partnership','homepage',
    'footer','investor','ebook','referral','service_request'
  )
);

-- Authenticated users: must own the lead
CREATE POLICY "Authenticated users insert own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND email IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Admins / sales: can insert any lead (server-side role check)
CREATE POLICY "Admins and sales can insert any lead"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'sales')
);
