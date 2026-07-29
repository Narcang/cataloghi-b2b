-- Permette agli agenti di aggiornare espositori e box dei rivenditori associati.
-- L'API verifica l'associazione gerarchica; la policy copre invito diretto e rubrica.

DROP POLICY IF EXISTS "Agente can update associated rivenditore specialization" ON public.profili;

CREATE POLICY "Agente can update associated rivenditore specialization"
  ON public.profili
  FOR UPDATE
  TO authenticated
  USING (
    ruolo = 'rivenditore'
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'agente'
    )
    AND (
      invitato_da = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.connessioni_utente_operatore c
        WHERE (c.utente_id = profili.id AND c.operatore_id = auth.uid())
           OR (c.operatore_id = profili.id AND c.utente_id = auth.uid())
      )
    )
  )
  WITH CHECK (ruolo = 'rivenditore');

-- Storico: anche gli agenti possono leggere/inserire snapshot (espositori/box rivenditore).
DROP POLICY IF EXISTS "storico_select_admin_manager" ON public.profili_specializzazione_storico;

CREATE POLICY "storico_select_admin_manager_agenzia_agente"
  ON public.profili_specializzazione_storico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente')
    )
  );

DROP POLICY IF EXISTS "storico_insert_admin_manager_agenzia" ON public.profili_specializzazione_storico;

CREATE POLICY "storico_insert_admin_manager_agenzia_agente"
  ON public.profili_specializzazione_storico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente')
    )
  );
