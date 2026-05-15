
-- Create platform_documents table for downloadable documents management
CREATE TABLE public.platform_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  target_audience TEXT DEFAULT 'public' CHECK (target_audience IN ('investors', 'project_owners', 'public')),
  access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'premium')),
  requires_login BOOLEAN DEFAULT false,
  file_url TEXT,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  cover_url TEXT,
  cover_path TEXT,
  associated_form TEXT DEFAULT 'public' CHECK (associated_form IN ('investor', 'public')),
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can view active documents metadata
CREATE POLICY "Active documents are viewable by everyone"
  ON public.platform_documents FOR SELECT
  USING (is_active = true OR (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )));

-- Admins can insert documents
CREATE POLICY "Admins can insert documents"
  ON public.platform_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admins can update documents
CREATE POLICY "Admins can update documents"
  ON public.platform_documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admins can delete documents
CREATE POLICY "Admins can delete documents"
  ON public.platform_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_platform_documents_updated_at
  BEFORE UPDATE ON public.platform_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
