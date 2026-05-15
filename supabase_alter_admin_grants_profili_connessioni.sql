-- Fix "permission denied for table profili" (e rubrica) per admin in dashboard.
-- Esegui nel SQL Editor di Supabase (una volta).
-- Richiede anche supabase_alter_profili_rls_admin_fix.sql (funzione current_user_is_admin).

-- 1) GRANT su profili (UPDATE per cambio ruolo; DELETE se non già applicato)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profili TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profili TO service_role;

-- 2) GRANT su collegamenti rubrica
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.connessioni_utente_operatore TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.connessioni_utente_operatore TO service_role;

-- 3) Policy connessioni: evita subquery su profili (come fix admin profili)
DROP POLICY IF EXISTS "connessioni_utente_operatore_select" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_select"
ON public.connessioni_utente_operatore
FOR SELECT
TO authenticated
USING (
  public.current_user_is_admin()
  OR utente_id = auth.uid()
  OR operatore_id = auth.uid()
);

DROP POLICY IF EXISTS "connessioni_utente_operatore_admin_insert" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_admin_insert"
ON public.connessioni_utente_operatore
FOR INSERT
TO authenticated
WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "connessioni_utente_operatore_admin_delete" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_admin_delete"
ON public.connessioni_utente_operatore
FOR DELETE
TO authenticated
USING (public.current_user_is_admin());
