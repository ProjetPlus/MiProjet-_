-- Sequences for ranking per content type
CREATE SEQUENCE IF NOT EXISTS public.news_short_slug_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.opportunity_short_slug_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.project_short_slug_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.document_short_slug_seq START 1;

-- Add short_slug columns
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS short_slug text UNIQUE;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS short_slug text UNIQUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS short_slug text UNIQUE;
ALTER TABLE public.platform_documents ADD COLUMN IF NOT EXISTS short_slug text UNIQUE;

-- Generic slug generator: prefix + zero-padded rank + month + last 3 of year, based on a created_at timestamp
CREATE OR REPLACE FUNCTION public.build_short_slug(_prefix text, _rank bigint, _ts timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT _prefix
    || lpad(_rank::text, 3, '0')
    || '-' || lpad(EXTRACT(MONTH FROM _ts)::text, 2, '0')
    || '-' || right(EXTRACT(YEAR FROM _ts)::text, 3);
$$;

-- Triggers to auto-fill short_slug on insert
CREATE OR REPLACE FUNCTION public.set_news_short_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.short_slug IS NULL THEN
    NEW.short_slug := public.build_short_slug('art', nextval('public.news_short_slug_seq'), COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_opportunity_short_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.short_slug IS NULL THEN
    NEW.short_slug := public.build_short_slug('opp', nextval('public.opportunity_short_slug_seq'), COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_project_short_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.short_slug IS NULL THEN
    NEW.short_slug := public.build_short_slug('prj', nextval('public.project_short_slug_seq'), COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_document_short_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.short_slug IS NULL THEN
    NEW.short_slug := public.build_short_slug('doc', nextval('public.document_short_slug_seq'), COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS news_short_slug_trg ON public.news;
CREATE TRIGGER news_short_slug_trg BEFORE INSERT ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_news_short_slug();

DROP TRIGGER IF EXISTS opportunity_short_slug_trg ON public.opportunities;
CREATE TRIGGER opportunity_short_slug_trg BEFORE INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_opportunity_short_slug();

DROP TRIGGER IF EXISTS project_short_slug_trg ON public.projects;
CREATE TRIGGER project_short_slug_trg BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_project_short_slug();

DROP TRIGGER IF EXISTS document_short_slug_trg ON public.platform_documents;
CREATE TRIGGER document_short_slug_trg BEFORE INSERT ON public.platform_documents FOR EACH ROW EXECUTE FUNCTION public.set_document_short_slug();

-- Backfill existing rows in chronological order
WITH ranked AS (
  SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn FROM public.news WHERE short_slug IS NULL
)
UPDATE public.news n SET short_slug = public.build_short_slug('art', r.rn, r.created_at)
FROM ranked r WHERE n.id = r.id;

WITH ranked AS (
  SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn FROM public.opportunities WHERE short_slug IS NULL
)
UPDATE public.opportunities o SET short_slug = public.build_short_slug('opp', r.rn, r.created_at)
FROM ranked r WHERE o.id = r.id;

WITH ranked AS (
  SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn FROM public.projects WHERE short_slug IS NULL
)
UPDATE public.projects p SET short_slug = public.build_short_slug('prj', r.rn, r.created_at)
FROM ranked r WHERE p.id = r.id;

WITH ranked AS (
  SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn FROM public.platform_documents WHERE short_slug IS NULL
)
UPDATE public.platform_documents d SET short_slug = public.build_short_slug('doc', r.rn, r.created_at)
FROM ranked r WHERE d.id = r.id;

-- Advance sequences past backfilled rows
SELECT setval('public.news_short_slug_seq', GREATEST((SELECT COUNT(*) FROM public.news), 1));
SELECT setval('public.opportunity_short_slug_seq', GREATEST((SELECT COUNT(*) FROM public.opportunities), 1));
SELECT setval('public.project_short_slug_seq', GREATEST((SELECT COUNT(*) FROM public.projects), 1));
SELECT setval('public.document_short_slug_seq', GREATEST((SELECT COUNT(*) FROM public.platform_documents), 1));