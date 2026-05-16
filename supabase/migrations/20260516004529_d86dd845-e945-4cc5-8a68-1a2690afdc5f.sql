-- Add missing foreign keys after verifying there are no orphan rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_owner_id_profiles_fkey') THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_owner_id_profiles_fkey
      FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_author_id_profiles_fkey') THEN
    ALTER TABLE public.opportunities
      ADD CONSTRAINT opportunities_author_id_profiles_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_documents_created_by_profiles_fkey') THEN
    ALTER TABLE public.platform_documents
      ADD CONSTRAINT platform_documents_created_by_profiles_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_user_id_profiles_fkey') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_user_id_profiles_fkey') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_service_request_id_fkey') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_service_request_id_fkey
      FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_user_id_profiles_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_project_id_projects_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_project_id_projects_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_service_request_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_service_request_id_fkey
      FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_user_id_profiles_fkey') THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT user_subscriptions_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_plan_id_fkey') THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT user_subscriptions_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_profiles_fkey') THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_campaigns_created_by_profiles_fkey') THEN
    ALTER TABLE public.email_campaigns
      ADD CONSTRAINT email_campaigns_created_by_profiles_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_campaign_id_fkey') THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_recipient_user_id_profiles_fkey') THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_recipient_user_id_profiles_fkey
      FOREIGN KEY (recipient_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_author_id ON public.opportunities(author_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);