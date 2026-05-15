
-- ============================================================
-- VAGUES 1, 2, 3 — Infrastructure DB consolidée MENU_ADMIN
-- ============================================================

-- ====== MODULE 1 : ID projet structuré 00012MIP ======
-- Séquence pour numérotation projets
CREATE SEQUENCE IF NOT EXISTS public.project_display_id_seq START 1;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS display_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.set_project_display_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := lpad(nextval('public.project_display_id_seq')::text, 5, '0') || 'MIP';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_display_id ON public.projects;
CREATE TRIGGER trg_set_project_display_id
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_display_id();

-- Backfill existing projects
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.projects WHERE display_id IS NULL ORDER BY created_at LOOP
    UPDATE public.projects
    SET display_id = lpad(nextval('public.project_display_id_seq')::text, 5, '0') || 'MIP'
    WHERE id = r.id;
  END LOOP;
END $$;

-- Same for mp_projects
ALTER TABLE public.mp_projects
  ADD COLUMN IF NOT EXISTS display_id text UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.mp_project_display_id_seq START 1;

CREATE OR REPLACE FUNCTION public.set_mp_project_display_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := lpad(nextval('public.mp_project_display_id_seq')::text, 5, '0') || 'MP';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_mp_project_display_id ON public.mp_projects;
CREATE TRIGGER trg_set_mp_project_display_id
  BEFORE INSERT ON public.mp_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_mp_project_display_id();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.mp_projects WHERE display_id IS NULL ORDER BY created_at LOOP
    UPDATE public.mp_projects
    SET display_id = lpad(nextval('public.mp_project_display_id_seq')::text, 5, '0') || 'MP'
    WHERE id = r.id;
  END LOOP;
END $$;

-- ====== MODULE 1 + 8 : stocker les réponses détaillées d'évaluation ======
ALTER TABLE public.project_evaluations
  ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS interpretation text,
  ADD COLUMN IF NOT EXISTS niveau_maturite integer,
  ADD COLUMN IF NOT EXISTS prochaines_etapes text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS parcours_recommande text,
  ADD COLUMN IF NOT EXISTS score_juridique numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_technique numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_marche numeric DEFAULT 0;

-- ====== MODULE 4 : statut utilisateurs (activer/suspendre) ======
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- ====== MODULE 6 : parrainage (parrain à l'inscription) ======
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid;

-- Trigger to auto-link referrer on signup if referred_by_code matches
CREATE OR REPLACE FUNCTION public.link_referrer_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
BEGIN
  IF NEW.referred_by_code IS NOT NULL AND NEW.referred_by_user_id IS NULL THEN
    SELECT id INTO v_referrer FROM public.profiles
      WHERE referral_code = NEW.referred_by_code AND id <> NEW.id LIMIT 1;
    IF v_referrer IS NOT NULL THEN
      NEW.referred_by_user_id := v_referrer;
      INSERT INTO public.referrals (referrer_id, referee_id, referral_code, status)
      VALUES (v_referrer, NEW.id, NEW.referred_by_code, 'pending')
      ON CONFLICT DO NOTHING;
      UPDATE public.profiles SET total_referrals = COALESCE(total_referrals,0) + 1 WHERE id = v_referrer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_referrer ON public.profiles;
CREATE TRIGGER trg_link_referrer
  BEFORE INSERT OR UPDATE OF referred_by_code ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_referrer_on_signup();

-- ====== MODULE 11 : journal des paiements ======
-- payments existe déjà — ajouter index user_id + status
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);

-- Vue admin agrégée (lien user)
CREATE OR REPLACE VIEW public.v_admin_payments AS
SELECT
  p.id, p.user_id, p.amount, p.currency, p.payment_method,
  p.payment_reference, p.status, p.created_at, p.updated_at, p.metadata,
  pr.first_name, pr.last_name, pr.email, pr.phone
FROM public.payments p
LEFT JOIN public.profiles pr ON pr.id = p.user_id;

-- ====== MODULE 12 : journal d'activation maintenance ======
CREATE TABLE IF NOT EXISTS public.maintenance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  enabled boolean NOT NULL,
  triggered_by uuid,
  triggered_by_email text,
  source text DEFAULT 'manual',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view maintenance log"
  ON public.maintenance_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert maintenance log"
  ON public.maintenance_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ====== MODULE 10 : parcours utilisateur ======
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  journey_type text NOT NULL, -- 'existing_activity' | 'startup'
  current_step integer NOT NULL DEFAULT 1,
  steps_completed integer[] DEFAULT '{}',
  step_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own journeys"
  ON public.user_journeys FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own journeys"
  ON public.user_journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own journeys"
  ON public.user_journeys FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete journeys"
  ON public.user_journeys FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_journeys_updated_at
  BEFORE UPDATE ON public.user_journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====== MODULE 5 : sources leads (déjà géré via lead_source text) ======
-- On documente les valeurs attendues via commentaire (pas de constraint pour rester souple)
COMMENT ON COLUMN public.leads.lead_source IS
  'Sources possibles: opportunity, investor, ebook, signup, service_request, referral, event, webinar, contact_form';

-- ====== Peupler quelques FAQ par défaut (Module 3) ======
INSERT INTO public.faqs (question, answer, category, sort_order, is_active) VALUES
  ('Comment soumettre mon projet ?', 'Cliquez sur « Soumettre un projet » depuis la page d''accueil, créez un compte si nécessaire, puis remplissez le formulaire en plusieurs étapes. Vous pourrez sauvegarder votre progression à tout moment.', 'projects', 1, true),
  ('Comment fonctionne l''évaluation MIPROJET ?', 'Notre système évalue votre projet sur 5 axes (Juridique 15pts, Financier 25pts, Technique 20pts, Marché 20pts, Impact 20pts) pour un total de 100 points. Vous obtenez ensuite un niveau de maturité et des recommandations personnalisées.', 'projects', 2, true),
  ('Que signifient les niveaux de score ?', '80-100 : Projet finançable. 60-79 : Projet prometteur. 40-59 : Projet fragile. Moins de 40 : Projet non finançable, structuration nécessaire.', 'projects', 3, true),
  ('Comment fonctionne le parrainage ?', 'Chaque utilisateur reçoit un code de parrainage unique. Partagez-le et gagnez 6,5% de commission sur les abonnements de vos filleuls.', 'account', 4, true),
  ('Quels moyens de paiement acceptez-vous ?', 'Nous acceptons Wave, Mobile Money, virements bancaires et cartes bancaires via nos partenaires de paiement sécurisés.', 'funding', 5, true),
  ('Mes données sont-elles sécurisées ?', 'Oui. Toutes les données sont chiffrées, stockées sur des serveurs sécurisés et protégées par des règles d''accès strictes (RLS). Nous respectons le RGPD.', 'security', 6, true),
  ('Puis-je modifier mon projet après soumission ?', 'Oui, vous pouvez modifier votre projet tant qu''il n''a pas été certifié. Une fois certifié, contactez le support pour toute modification.', 'projects', 7, true),
  ('Comment contacter le support ?', 'Utilisez le formulaire de contact, l''assistant virtuel en bas de page, ou écrivez à support@miprojet.ci.', 'general', 8, true)
ON CONFLICT DO NOTHING;
