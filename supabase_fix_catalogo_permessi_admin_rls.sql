-- Permette ad admin/manager di leggere e scrivere catalogo_permessi_utente
-- senza dipendere dalla service role key in produzione.

GRANT SELECT, INSERT, DELETE, UPDATE ON public.catalogo_permessi_utente TO authenticated;

DROP POLICY IF EXISTS "cpu_self_read" ON public.catalogo_permessi_utente;
DROP POLICY IF EXISTS "cpu_admin_manager_all" ON public.catalogo_permessi_utente;

CREATE POLICY "cpu_self_read" ON public.catalogo_permessi_utente
  FOR SELECT TO authenticated
  USING (utente_id = auth.uid());

CREATE POLICY "cpu_admin_manager_all" ON public.catalogo_permessi_utente
  FOR ALL TO authenticated
  USING (
    public.current_user_is_admin()
    OR public.current_user_is_manager()
  )
  WITH CHECK (
    public.current_user_is_admin()
    OR public.current_user_is_manager()
  );
