
-- Fix infinite recursion on user_roles table
-- The "Admins can manage roles" ALL policy self-references user_roles causing recursion

-- Drop the problematic self-referencing policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate separate policies using the SECURITY DEFINER function has_role() which bypasses RLS
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
