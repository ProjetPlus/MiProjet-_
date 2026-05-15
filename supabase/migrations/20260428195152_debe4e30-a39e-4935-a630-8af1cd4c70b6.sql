-- Add author_name to news and opportunities so admins can control the displayed author
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS author_name TEXT;