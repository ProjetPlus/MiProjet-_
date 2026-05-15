
-- 1) Bucket documents privé
UPDATE storage.buckets SET public = false WHERE id = 'documents';

DROP POLICY IF EXISTS "Public can read platform covers" ON storage.objects;
CREATE POLICY "Public can read platform covers"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'platform-covers'
);

-- 2) Leads : remplacer la policy basée sur le claim JWT user_role
DROP POLICY IF EXISTS "Sales team inserts" ON public.leads;
DROP POLICY IF EXISTS "Sales team can insert leads" ON public.leads;

CREATE POLICY "Admins and sales can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'sales')
);

-- 3) Leads : soumissions anonymes validées
DROP POLICY IF EXISTS "Anyone can submit a public lead" ON public.leads;

CREATE POLICY "Anyone can submit a public lead"
ON public.leads FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(coalesce(first_name, '')) BETWEEN 1 AND 100
  AND length(coalesce(last_name, '')) BETWEEN 0 AND 100
  AND coalesce(lead_source, 'general') IN (
    'general','signup','contact','newsletter','document','opportunity','project',
    'subscription','event','training','partnership','homepage','footer'
  )
);

-- 4) database_backups : update/delete admin
DROP POLICY IF EXISTS "Admins can update backup records" ON public.database_backups;
DROP POLICY IF EXISTS "Admins can delete backup records" ON public.database_backups;

CREATE POLICY "Admins can update backup records"
ON public.database_backups FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup records"
ON public.database_backups FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
