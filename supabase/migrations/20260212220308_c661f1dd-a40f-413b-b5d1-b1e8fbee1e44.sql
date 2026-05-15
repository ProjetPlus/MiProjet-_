
-- Add missing columns to project_evaluations
ALTER TABLE public.project_evaluations ADD COLUMN IF NOT EXISTS actions_structuration TEXT[] DEFAULT '{}';
ALTER TABLE public.project_evaluations ADD COLUMN IF NOT EXISTS messages_strategiques TEXT[] DEFAULT '{}';

-- Create project_updates table
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project updates are viewable by project participants" ON public.project_updates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR status = 'published'))
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Project owners can insert updates" ON public.project_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
