-- Email Marketing system

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preheader text,
  html text NOT NULL,
  segment text NOT NULL DEFAULT 'newsletter',
  segment_filter jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count int DEFAULT 0,
  sent_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  ai_prompt text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'campaign',
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  subject text,
  status text NOT NULL DEFAULT 'pending',
  provider_id text,
  error text,
  sent_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  subject text,
  html text NOT NULL,
  variables jsonb DEFAULT '{}'::jsonb,
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.email_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert logs" ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_email_campaigns_updated
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_email_templates_updated
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed system templates
INSERT INTO public.email_templates (name, description, subject, html, is_system) VALUES
('newsletter_welcome', 'Email de bienvenue à l''inscription newsletter', 'Bienvenue dans la newsletter MIPROJET',
 '<h1>Bienvenue !</h1><p>Merci de rejoindre la communauté MIPROJET. Vous recevrez nos meilleures opportunités et actualités.</p>', true),
('subscription_welcome', 'Email de bienvenue après abonnement payant', 'Votre abonnement MIPROJET est actif',
 '<h1>Merci pour votre abonnement</h1><p>Votre accès Premium est maintenant actif.</p>', true),
('new_opportunity_alert', 'Notification nouvelle opportunité (Premium/Elite)', '🚀 Nouvelle opportunité exclusive',
 '<h1>{{title}}</h1><p>{{description}}</p><a href="{{url}}">Découvrir</a>', true)
ON CONFLICT (name) DO NOTHING;