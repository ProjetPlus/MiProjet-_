-- Table pour les demandes d'accès aux projets
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Policies pour access_requests
CREATE POLICY "Users can view own access requests"
  ON public.access_requests FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create access requests"
  ON public.access_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access requests"
  ON public.access_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table pour les sauvegardes de base de données (metadata)
CREATE TABLE IF NOT EXISTS public.database_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_name TEXT NOT NULL,
  backup_type TEXT DEFAULT 'manual' CHECK (backup_type IN ('manual', 'automatic')),
  tables_included TEXT[],
  file_path TEXT,
  file_size BIGINT,
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'csv', 'sql')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_by UUID,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backups
CREATE POLICY "Admins can manage backups"
  ON public.database_backups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table pour les paramètres de sauvegarde automatique
CREATE TABLE IF NOT EXISTS public.backup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  retention_days INTEGER DEFAULT 30,
  tables_to_backup TEXT[],
  last_backup_at TIMESTAMP WITH TIME ZONE,
  next_backup_at TIMESTAMP WITH TIME ZONE,
  external_storage_type TEXT CHECK (external_storage_type IN ('google_drive', 'ovh')),
  external_storage_config JSONB DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backup settings
CREATE POLICY "Admins can manage backup settings"
  ON public.backup_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.backup_settings (id, is_enabled, frequency, retention_days)
VALUES (gen_random_uuid(), false, 'daily', 30)
ON CONFLICT DO NOTHING;

-- Trigger pour updated_at sur access_requests
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();