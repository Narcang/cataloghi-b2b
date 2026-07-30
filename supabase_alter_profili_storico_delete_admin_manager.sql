-- Consente ad admin e manager di correggere lo storico specializzazione
-- (UPDATE voci JSONB o DELETE riga quando l'ultima voce viene rimossa).
-- Eseguire su Supabase se DELETE/UPDATE falliscono senza service role.

GRANT UPDATE, DELETE ON public.profili_specializzazione_storico TO authenticated;

DROP POLICY IF EXISTS "storico_update_admin_manager" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_update_admin_manager"
  ON public.profili_specializzazione_storico
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "storico_delete_admin_manager" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_delete_admin_manager"
  ON public.profili_specializzazione_storico
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager')
    )
  );
