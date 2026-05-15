CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN 'MIP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


--
-- Name: set_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contributions_amount_check CHECK ((amount > (0)::numeric))
);

ALTER TABLE ONLY public.contributions REPLICA IDENTITY FULL;


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    user_id uuid NOT NULL,
    service_request_id uuid,
    project_id uuid,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric DEFAULT 0 NOT NULL,
    tax_rate numeric DEFAULT 0,
    tax_amount numeric DEFAULT 0,
    total numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'XOF'::text,
    status text DEFAULT 'draft'::text,
    due_date date,
    paid_at timestamp with time zone,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.messages REPLICA IDENTITY FULL;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    service_request_id uuid,
    amount numeric NOT NULL,
    currency text DEFAULT 'XOF'::text,
    payment_method text NOT NULL,
    payment_reference text,
    status text DEFAULT 'pending'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    encrypted_metadata text,
    last_accessed_at timestamp with time zone,
    access_count integer DEFAULT 0,
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: payments_secure; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.payments_secure WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    project_id,
    service_request_id,
    amount,
    currency,
    payment_method,
    status,
    created_at,
    updated_at,
        CASE
            WHEN (payment_reference IS NOT NULL) THEN concat("left"(payment_reference, 4), '****', "right"(payment_reference, 4))
            ELSE NULL::text
        END AS payment_reference_masked
   FROM public.payments;


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    category text DEFAULT 'general'::text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_type text DEFAULT 'individual'::text,
    phone text,
    company_name text,
    avatar_url text,
    bio text,
    country text,
    city text,
    is_verified boolean DEFAULT false
);


--
-- Name: project_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.project_updates REPLICA IDENTITY FULL;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    country text,
    city text,
    funding_goal numeric,
    funds_raised numeric DEFAULT 0 NOT NULL,
    risk_score text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.projects REPLICA IDENTITY FULL;


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_type text NOT NULL,
    company_name text,
    company_type text,
    has_business_plan boolean DEFAULT false,
    has_financial_statements boolean DEFAULT false,
    annual_revenue numeric,
    funding_needed numeric,
    project_stage text,
    sector text,
    description text,
    documents jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    financial_data_encrypted boolean DEFAULT false,
    audit_trail jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT service_requests_company_type_check CHECK ((company_type = ANY (ARRAY['startup'::text, 'pme'::text, 'grande_entreprise'::text, 'association'::text, 'cooperative'::text, 'individuel'::text]))),
    CONSTRAINT service_requests_project_stage_check CHECK ((project_stage = ANY (ARRAY['idea'::text, 'prototype'::text, 'launched'::text, 'scaling'::text]))),
    CONSTRAINT service_requests_service_type_check CHECK ((service_type = ANY (ARRAY['structuration'::text, 'financement'::text, 'accompagnement'::text, 'formation'::text, 'complet'::text]))),
    CONSTRAINT service_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: user_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    file_size integer,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_key_key UNIQUE (key);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: project_updates project_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: user_documents user_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: invoices trigger_set_invoice_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_settings update_platform_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_requests update_service_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_documents update_user_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contributions contributions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: payments payments_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: project_updates project_updates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_documents Admins can manage all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all documents" ON public.user_documents USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invoices" ON public.invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: platform_settings Admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage settings" ON public.platform_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contributions Admins manage all contributions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all contributions" ON public.contributions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins manage all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all messages" ON public.messages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins manage all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all payments" ON public.payments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: projects Admins manage all projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all projects" ON public.projects USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_requests Admins manage all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all requests" ON public.service_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: project_updates Admins manage all updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all updates" ON public.project_updates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contributions Authenticated can contribute; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can contribute" ON public.contributions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: platform_settings Authenticated can read settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);


--
-- Name: messages Authenticated can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND ((auth.uid() = ( SELECT p.owner_id
   FROM public.projects p
  WHERE (p.id = messages.project_id))) OR (EXISTS ( SELECT 1
   FROM public.contributions c
  WHERE ((c.project_id = c.project_id) AND (c.user_id = auth.uid())))))));


--
-- Name: profiles Authenticated can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: contributions Owner or contributor can view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner or contributor can view" ON public.contributions FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() = ( SELECT p.owner_id
   FROM public.projects p
  WHERE (p.id = contributions.project_id)))));


--
-- Name: projects Owners can delete own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can delete own projects" ON public.projects FOR DELETE USING ((auth.uid() = owner_id));


--
-- Name: projects Owners can insert projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can insert projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: project_updates Owners can manage updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage updates" ON public.project_updates USING ((auth.uid() = ( SELECT p.owner_id
   FROM public.projects p
  WHERE (p.id = project_updates.project_id)))) WITH CHECK ((auth.uid() = ( SELECT p.owner_id
   FROM public.projects p
  WHERE (p.id = project_updates.project_id))));


--
-- Name: projects Owners can update own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update own projects" ON public.projects FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: projects Owners can view own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view own projects" ON public.projects FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: messages Participants can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (((auth.uid() = ( SELECT p.owner_id
   FROM public.projects p
  WHERE (p.id = messages.project_id))) OR (EXISTS ( SELECT 1
   FROM public.contributions c
  WHERE ((c.project_id = c.project_id) AND (c.user_id = auth.uid()))))));


--
-- Name: projects Public can view published projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published projects" ON public.projects FOR SELECT USING ((status = 'published'::text));


--
-- Name: project_updates Public can view updates on published projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view updates on published projects" ON public.project_updates FOR SELECT USING ((( SELECT p.status
   FROM public.projects p
  WHERE (p.id = project_updates.project_id)) = 'published'::text));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: payments Users can create payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: service_requests Users can create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create requests" ON public.service_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: service_requests Users can update own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own requests" ON public.service_requests FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_documents Users can upload own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload own documents" ON public.user_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_documents Users can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documents" ON public.user_documents FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: invoices Users can view own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: payments Users can view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: service_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.service_requests FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: project_updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: service_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: user_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;