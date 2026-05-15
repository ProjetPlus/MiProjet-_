-- Create categories table for project categorization
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  name_ar TEXT,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sectors table
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  name_ar TEXT,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_progress table for multi-step form saving
CREATE TABLE IF NOT EXISTS public.form_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_type TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  data JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, form_type)
);

-- Create payment_history view for dashboard
CREATE OR REPLACE VIEW public.payment_history AS
SELECT 
  p.id,
  p.user_id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.payment_reference,
  p.created_at,
  pr.title as project_title,
  sr.service_type
FROM public.payments p
LEFT JOIN public.projects pr ON p.project_id = pr.id
LEFT JOIN public.service_requests sr ON p.service_request_id = sr.id;

-- Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_progress ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Anyone can read categories"
ON public.categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sectors policies (public read)
CREATE POLICY "Anyone can read sectors"
ON public.sectors FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage sectors"
ON public.sectors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Form progress policies
CREATE POLICY "Users can manage own form progress"
ON public.form_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for form_progress updated_at
CREATE TRIGGER update_form_progress_updated_at
BEFORE UPDATE ON public.form_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, name_en, name_ar, description, icon, sort_order) VALUES
('Agriculture', 'Agriculture', 'زراعة', 'Projets agricoles et agroalimentaires', 'sprout', 1),
('Technologie', 'Technology', 'تكنولوجيا', 'Projets technologiques et numériques', 'cpu', 2),
('Éducation', 'Education', 'تعليم', 'Projets éducatifs et formation', 'graduation-cap', 3),
('Santé', 'Health', 'صحة', 'Projets de santé et bien-être', 'heart-pulse', 4),
('Énergie', 'Energy', 'طاقة', 'Projets énergétiques et environnementaux', 'zap', 5),
('Commerce', 'Commerce', 'تجارة', 'Projets commerciaux et services', 'shopping-bag', 6),
('Immobilier', 'Real Estate', 'عقارات', 'Projets immobiliers et construction', 'building-2', 7),
('Transport', 'Transport', 'نقل', 'Projets de transport et logistique', 'truck', 8),
('Tourisme', 'Tourism', 'سياحة', 'Projets touristiques et hôteliers', 'plane', 9),
('Industrie', 'Industry', 'صناعة', 'Projets industriels et manufacturiers', 'factory', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert default sectors
INSERT INTO public.sectors (name, name_en, name_ar, description, icon) VALUES
('Startup', 'Startup', 'شركة ناشئة', 'Entreprises innovantes en démarrage', 'rocket'),
('PME', 'SME', 'شركة صغيرة', 'Petites et moyennes entreprises', 'building'),
('Grande Entreprise', 'Large Enterprise', 'شركة كبيرة', 'Grandes entreprises établies', 'building-2'),
('Coopérative', 'Cooperative', 'تعاونية', 'Organisations coopératives', 'users'),
('ONG', 'NGO', 'منظمة غير حكومية', 'Organisations non gouvernementales', 'heart'),
('Association', 'Association', 'جمعية', 'Associations et collectifs', 'users-2')
ON CONFLICT (name) DO NOTHING;

-- Add image_url column to projects if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'image_url') THEN
    ALTER TABLE public.projects ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sector') THEN
    ALTER TABLE public.projects ADD COLUMN sector TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
    ALTER TABLE public.projects ADD COLUMN end_date DATE;
  END IF;
END $$;