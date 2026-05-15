CREATE OR REPLACE FUNCTION public.build_short_slug(_prefix text, _rank bigint, _ts timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT _prefix
    || lpad(_rank::text, 3, '0')
    || '-' || lpad(EXTRACT(MONTH FROM _ts)::text, 2, '0')
    || '-' || right(EXTRACT(YEAR FROM _ts)::text, 3);
$$;