
-- MiProjet+ Projects table
CREATE TABLE public.mp_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT DEFAULT 'micro_activity',
  sector TEXT,
  legal_status TEXT,
  creation_date DATE,
  city TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  annual_revenue NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  employees_count INTEGER DEFAULT 0,
  has_accounting BOOLEAN DEFAULT false,
  has_bank_account BOOLEAN DEFAULT false,
  has_business_plan BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mp_projects" ON public.mp_projects FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own mp_projects" ON public.mp_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mp_projects" ON public.mp_projects FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own mp_projects" ON public.mp_projects FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mp_projects_user_id ON public.mp_projects(user_id);

-- Scoring Results table
CREATE TABLE public.mp_scoring_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.mp_projects(id) ON DELETE CASCADE,
  score_juridique NUMERIC DEFAULT 0,
  score_financier NUMERIC DEFAULT 0,
  score_technique NUMERIC DEFAULT 0,
  score_marche NUMERIC DEFAULT 0,
  score_impact NUMERIC DEFAULT 0,
  score_global NUMERIC DEFAULT 0,
  niveau TEXT,
  answers JSONB DEFAULT '{}',
  recommandations TEXT[] DEFAULT '{}',
  forces TEXT[] DEFAULT '{}',
  faiblesses TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_scoring_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scoring" ON public.mp_scoring_results FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own scoring" ON public.mp_scoring_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scoring" ON public.mp_scoring_results FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own scoring" ON public.mp_scoring_results FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mp_scoring_project ON public.mp_scoring_results(project_id);
CREATE INDEX idx_mp_scoring_user ON public.mp_scoring_results(user_id);

-- Financial Records table
CREATE TABLE public.mp_financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.mp_projects(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'revenue',
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'XOF',
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial_records" ON public.mp_financial_records FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own financial_records" ON public.mp_financial_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial_records" ON public.mp_financial_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial_records" ON public.mp_financial_records FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mp_financial_project ON public.mp_financial_records(project_id);
CREATE INDEX idx_mp_financial_user ON public.mp_financial_records(user_id);
CREATE INDEX idx_mp_financial_date ON public.mp_financial_records(record_date);

-- Certifications table
CREATE TABLE public.mp_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.mp_projects(id) ON DELETE CASCADE,
  scoring_id UUID REFERENCES public.mp_scoring_results(id) ON DELETE SET NULL,
  certification_type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'pending',
  certified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  report_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certifications" ON public.mp_certifications FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own certifications" ON public.mp_certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update certifications" ON public.mp_certifications FOR UPDATE USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Users can delete own certifications" ON public.mp_certifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mp_certifications_project ON public.mp_certifications(project_id);
CREATE INDEX idx_mp_certifications_user ON public.mp_certifications(user_id);

-- Funder Connections table
CREATE TABLE public.mp_funder_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.mp_projects(id) ON DELETE CASCADE,
  funder_name TEXT NOT NULL,
  funder_type TEXT DEFAULT 'bank',
  contact_info TEXT,
  status TEXT DEFAULT 'prospect',
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_funder_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own funder_connections" ON public.mp_funder_connections FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own funder_connections" ON public.mp_funder_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own funder_connections" ON public.mp_funder_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own funder_connections" ON public.mp_funder_connections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mp_funder_user ON public.mp_funder_connections(user_id);
CREATE INDEX idx_mp_funder_project ON public.mp_funder_connections(project_id);

-- Triggers for updated_at
CREATE TRIGGER update_mp_projects_updated_at BEFORE UPDATE ON public.mp_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mp_scoring_updated_at BEFORE UPDATE ON public.mp_scoring_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mp_financial_updated_at BEFORE UPDATE ON public.mp_financial_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mp_certifications_updated_at BEFORE UPDATE ON public.mp_certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mp_funder_updated_at BEFORE UPDATE ON public.mp_funder_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
