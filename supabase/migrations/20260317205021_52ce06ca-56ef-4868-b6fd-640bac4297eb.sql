-- 1) Helper: active subscription check (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    WHERE us.user_id = _user_id
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  );
$$;

-- 2) Helper: profile type check (investor/project owner targeting)
CREATE OR REPLACE FUNCTION public.user_profile_type(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.user_type FROM public.profiles p WHERE p.id = _user_id), 'individual');
$$;

-- 3) Tighten opportunities read policy: premium only for active subscribers
DROP POLICY IF EXISTS "Published opportunities are viewable by everyone" ON public.opportunities;
CREATE POLICY "Published opportunities follow access rules"
ON public.opportunities
FOR SELECT
TO public
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    status = 'published'
    AND COALESCE(is_active, true) = true
    AND (
      COALESCE(is_premium, false) = false
      OR (auth.uid() IS NOT NULL AND public.has_active_subscription(auth.uid()))
    )
  )
);

-- 4) Tighten documents read policy: premium + audience + login constraints
DROP POLICY IF EXISTS "Active documents are viewable by everyone" ON public.platform_documents;
CREATE POLICY "Documents follow access and audience rules"
ON public.platform_documents
FOR SELECT
TO public
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    COALESCE(is_active, false) = true
    AND (
      COALESCE(requires_login, false) = false
      OR auth.uid() IS NOT NULL
    )
    AND (
      COALESCE(access_level, 'free') <> 'premium'
      OR (auth.uid() IS NOT NULL AND public.has_active_subscription(auth.uid()))
    )
    AND (
      COALESCE(target_audience, 'public') = 'public'
      OR (
        COALESCE(target_audience, 'public') = 'investors'
        AND auth.uid() IS NOT NULL
        AND public.user_profile_type(auth.uid()) = 'investor'
      )
      OR (
        COALESCE(target_audience, 'public') = 'project_owners'
        AND auth.uid() IS NOT NULL
        AND public.user_profile_type(auth.uid()) IN ('individual', 'enterprise')
      )
    )
  )
);

-- 5) Immediate mandatory revocation for user: be3bb534-... (Kouadio)
UPDATE public.user_subscriptions
SET status = 'cancelled',
    expires_at = now(),
    updated_at = now(),
    payment_id = NULL
WHERE user_id = 'be3bb534-4d5b-4e0f-a4e0-51d3df777213';

-- 6) Remove 100F test payments and break FK links first
UPDATE public.user_subscriptions
SET payment_id = NULL,
    updated_at = now()
WHERE payment_id IN (
  SELECT id FROM public.payments WHERE amount = 100
);

UPDATE public.contributions
SET payment_id = NULL
WHERE payment_id IN (
  SELECT id FROM public.payments WHERE amount = 100
);

DELETE FROM public.payments
WHERE amount = 100;

-- 7) Make investor guide non-public (login + investor audience)
UPDATE public.platform_documents
SET requires_login = true,
    target_audience = 'investors',
    associated_form = 'investor',
    updated_at = now()
WHERE title ILIKE '%50 Opportunit%';

-- 8) Cleanup obvious test/demo data (excluding news)
DELETE FROM public.projects
WHERE COALESCE(title, '') ILIKE '%test%'
   OR COALESCE(title, '') ILIKE '%demo%'
   OR COALESCE(description, '') ILIKE '%test%'
   OR COALESCE(description, '') ILIKE '%demo%';

DELETE FROM public.opportunities
WHERE COALESCE(title, '') ILIKE '%test%'
   OR COALESCE(title, '') ILIKE '%demo%'
   OR COALESCE(description, '') ILIKE '%test%'
   OR COALESCE(description, '') ILIKE '%demo%'
   OR COALESCE(content, '') ILIKE '%test%'
   OR COALESCE(content, '') ILIKE '%demo%';

DELETE FROM public.platform_documents
WHERE COALESCE(title, '') ILIKE '%test%'
   OR COALESCE(title, '') ILIKE '%demo%'
   OR COALESCE(description, '') ILIKE '%test%'
   OR COALESCE(description, '') ILIKE '%demo%';