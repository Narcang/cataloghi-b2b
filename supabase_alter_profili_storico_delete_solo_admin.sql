-- Storico specializzazione: eliminazione voci solo admin (non manager/agenzia).
-- Eseguire su Supabase se DELETE/UPDATE falliscono senza service role.

DROP POLICY IF EXISTS "storico_update_agenzia_rivenditore" ON public.profili_specializzazione_storico;
DROP POLICY IF EXISTS "storico_delete_agenzia_rivenditore" ON public.profili_specializzazione_storico;

DROP POLICY IF EXISTS "storico_update_admin_manager" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_update_admin"
  ON public.profili_specializzazione_storico
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'admin'
    )
  );

DROP POLICY IF EXISTS "storico_delete_admin_manager" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_delete_admin"
  ON public.profili_specializzazione_storico
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'admin'
    )
  );
