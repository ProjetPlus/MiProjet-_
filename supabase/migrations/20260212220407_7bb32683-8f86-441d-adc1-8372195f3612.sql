
ALTER TABLE public.project_evaluations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
