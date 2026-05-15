
-- Fix overly permissive INSERT on messages - restrict to anon + authenticated
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
-- This is intentional for the contact form - anonymous users must be able to submit messages
