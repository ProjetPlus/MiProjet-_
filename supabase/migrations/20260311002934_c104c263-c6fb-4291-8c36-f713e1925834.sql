
-- Add is_premium column to opportunities
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Create leads table for capturing contact info
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  whatsapp text,
  country text,
  city text,
  sector text,
  entity_type text, -- particulier, SARL, coop, association, ONG, etc.
  company_name text,
  needs text,
  difficulties text,
  lead_source text NOT NULL DEFAULT 'opportunity', -- opportunity, investor, ebook
  source_id text, -- opportunity_id or other reference
  investment_capacity text,
  risk_tolerance text,
  interested_sectors text[],
  wants_project_proposals boolean DEFAULT false,
  wants_foundation_participation boolean DEFAULT false,
  additional_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (public form)
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO public WITH CHECK (true);

-- Admins can view all leads
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Admins can update leads
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
