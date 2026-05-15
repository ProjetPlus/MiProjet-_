
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_commissions NUMERIC DEFAULT 0;

-- Add missing columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS funds_raised NUMERIC DEFAULT 0;

-- Add missing columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add missing columns to database_backups
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS tables_included TEXT[];
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'json';
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create contributions table (used in AdminStats and UserDashboardStats)
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'completed',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own contributions" ON public.contributions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert contributions" ON public.contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create form_progress table
CREATE TABLE public.form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  data JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, form_type)
);
ALTER TABLE public.form_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON public.form_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.form_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.form_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.form_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_form_progress_updated_at BEFORE UPDATE ON public.form_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
