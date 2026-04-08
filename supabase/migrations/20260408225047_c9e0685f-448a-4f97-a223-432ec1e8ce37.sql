
-- =============================================
-- FIX 1: user_roles - tighten policies
-- =============================================

-- Drop the overly broad ALL policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Replace with specific per-operation policies
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- FIX 2: request_logs - remove open INSERT policy
-- Inserts go through insert_request_log() SECURITY DEFINER function
-- =============================================

-- Check and drop any INSERT policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert request logs" ON public.request_logs;
DROP POLICY IF EXISTS "Edge functions can insert request logs" ON public.request_logs;
DROP POLICY IF EXISTS "System can insert request logs" ON public.request_logs;
