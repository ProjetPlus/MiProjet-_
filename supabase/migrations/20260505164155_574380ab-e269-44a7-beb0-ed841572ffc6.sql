
-- 1) Referrals: ensure referrer_id = auth.uid()
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.referrals', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can insert their own referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can insert any referral"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) mp_certifications: force users to status='pending', only admins can create with other status
DROP POLICY IF EXISTS "Users can insert own certifications" ON public.mp_certifications;

CREATE POLICY "Users can insert own pending certifications"
ON public.mp_certifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(status, 'pending') = 'pending'
  AND certified_at IS NULL
);

CREATE POLICY "Admins can insert any certification"
ON public.mp_certifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict status transitions on UPDATE: only admins can mark certified/expired
DROP POLICY IF EXISTS "Admins can update certifications" ON public.mp_certifications;

CREATE POLICY "Admins can update any certification"
ON public.mp_certifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own pending certifications"
ON public.mp_certifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND COALESCE(status,'pending') = 'pending')
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(status,'pending') = 'pending'
  AND certified_at IS NULL
);

-- 3) user_subscriptions: users may only insert pending subs; admins/service role activate
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_subscriptions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can insert pending subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(status, 'pending') = 'pending'
);

CREATE POLICY "Admins can insert any subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Prevent users from upgrading their own subscriptions to active via UPDATE
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND cmd='UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_subscriptions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can update any subscription"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can cancel own subscription"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('cancelled', 'pending')
);
