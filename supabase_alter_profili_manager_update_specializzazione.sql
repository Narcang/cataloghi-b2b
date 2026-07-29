-- Permette ai manager di aggiornare i profili agenzia/rivenditore (specializzazione).
-- L'API limita i campi modificabili; la policy consente UPDATE sulle righe target.

DROP POLICY IF EXISTS "Manager can update agenzia rivenditore profili" ON public.profili;

CREATE POLICY "Manager can update agenzia rivenditore profili"
  ON public.profili
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_is_manager()
    AND ruolo IN ('agenzia', 'rivenditore')
  )
  WITH CHECK (
    public.current_user_is_manager()
    AND ruolo IN ('agenzia', 'rivenditore')
  );

-- Storico: anche i manager possono inserire snapshot al salvataggio specializzazione.
DROP POLICY IF EXISTS "storico_insert_admin" ON public.profili_specializzazione_storico;

CREATE POLICY "storico_insert_admin_manager"
  ON public.profili_specializzazione_storico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager')
    )
  );
