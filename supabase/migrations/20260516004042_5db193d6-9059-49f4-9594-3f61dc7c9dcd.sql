-- Remove anonymous execution of SECURITY DEFINER helpers and split public/admin policies.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_profile_type(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_payments() FROM anon;

-- Opportunities: public published rows without role helper, admins see all.
DROP POLICY IF EXISTS "Published opportunities follow access rules" ON public.opportunities;
DROP POLICY IF EXISTS "Published opportunities are viewable" ON public.opportunities;
DROP POLICY IF EXISTS "Admins can view all opportunities" ON public.opportunities;
CREATE POLICY "Published opportunities are viewable"
ON public.opportunities
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  AND COALESCE(is_active, true) = true
  AND COALESCE(is_premium, false) = false
);
CREATE POLICY "Authenticated premium opportunities are viewable"
ON public.opportunities
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND COALESCE(is_active, true) = true
  AND COALESCE(is_premium, false) = true
  AND public.has_active_subscription(auth.uid())
);
CREATE POLICY "Admins can view all opportunities"
ON public.opportunities
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Platform documents: public/free docs without role helper, admins see all.
DROP POLICY IF EXISTS "Documents follow access and audience rules" ON public.platform_documents;
DROP POLICY IF EXISTS "Public documents are viewable" ON public.platform_documents;
DROP POLICY IF EXISTS "Authenticated documents are viewable" ON public.platform_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.platform_documents;
CREATE POLICY "Public documents are viewable"
ON public.platform_documents
FOR SELECT
TO anon, authenticated
USING (
  COALESCE(is_active, false) = true
  AND COALESCE(requires_login, false) = false
  AND COALESCE(access_level, 'free') <> 'premium'
  AND COALESCE(target_audience, 'public') = 'public'
);
CREATE POLICY "Authenticated documents are viewable"
ON public.platform_documents
FOR SELECT
TO authenticated
USING (
  COALESCE(is_active, false) = true
  AND (
    COALESCE(access_level, 'free') <> 'premium'
    OR public.has_active_subscription(auth.uid())
  )
  AND (
    COALESCE(target_audience, 'public') = 'public'
    OR (COALESCE(target_audience, 'public') = 'investors' AND public.user_profile_type(auth.uid()) = 'investor')
    OR (COALESCE(target_audience, 'public') = 'project_owners' AND public.user_profile_type(auth.uid()) = ANY (ARRAY['individual', 'enterprise']))
  )
);
CREATE POLICY "Admins can view all documents"
ON public.platform_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Projects: keep public published access separate from admin access.
DROP POLICY IF EXISTS "Published projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Published projects are viewable" ON public.projects;
DROP POLICY IF EXISTS "Project owners can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Published projects are viewable"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (status = 'published');
CREATE POLICY "Project owners can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FAQs: public active access separate from admin access.
DROP POLICY IF EXISTS "Active FAQs are viewable by everyone" ON public.faqs;
DROP POLICY IF EXISTS "Admins can view all FAQs" ON public.faqs;
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
