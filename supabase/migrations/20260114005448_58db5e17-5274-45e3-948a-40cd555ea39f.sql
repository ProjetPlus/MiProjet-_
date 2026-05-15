-- Table des évaluations de projets (MIPROJET SCORE)
CREATE TABLE public.project_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Scores par axe (sur 100)
  score_global INTEGER DEFAULT 0,
  score_porteur INTEGER DEFAULT 0,
  score_projet INTEGER DEFAULT 0,
  score_financier INTEGER DEFAULT 0,
  score_maturite INTEGER DEFAULT 0,
  score_impact INTEGER DEFAULT 0,
  score_equipe INTEGER DEFAULT 0,
  
  -- Niveau et statut
  niveau VARCHAR(20) DEFAULT 'en_cours',
  is_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMPTZ,
  certified_by UUID,
  
  -- Contenu de l'évaluation
  resume TEXT,
  forces JSONB DEFAULT '[]',
  faiblesses JSONB DEFAULT '[]',
  recommandations JSONB DEFAULT '[]',
  actions_structuration JSONB DEFAULT '[]',
  messages_strategiques JSONB DEFAULT '[]',
  
  -- Métadonnées
  evaluation_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  evaluated_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.project_evaluations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les évaluations
CREATE POLICY "Users can view their own project evaluations" 
ON public.project_evaluations 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can insert evaluations" 
ON public.project_evaluations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update evaluations" 
ON public.project_evaluations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete evaluations" 
ON public.project_evaluations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Ajouter champ fonds_disponibles aux projects si pas déjà présent
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS fonds_disponibles VARCHAR(100);

-- Trigger pour mettre à jour updated_at sur project_evaluations
CREATE TRIGGER update_project_evaluations_updated_at
BEFORE UPDATE ON public.project_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();