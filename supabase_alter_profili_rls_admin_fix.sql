-- Fix RLS admin su profili: la subquery EXISTS(... FROM profili ...) può impedire UPDATE/RETURNING.
-- Esegui nel SQL Editor di Supabase.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili p
    WHERE p.id = auth.uid()
      AND p.ruolo = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO service_role;

DROP POLICY IF EXISTS "Admin gestisce tutti i profili" ON public.profili;

CREATE POLICY "Admin gestisce tutti i profili" ON public.profili
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
