-- Consente alle agenzie di correggere lo storico espositori/box dei rivenditori associati.
-- Rimuove le policy errate per agente (se presenti) e crea quelle per agenzia.
-- Eseguire su Supabase se DELETE/UPDATE falliscono senza service role.

DROP POLICY IF EXISTS "storico_update_agente_rivenditore" ON public.profili_specializzazione_storico;
DROP POLICY IF EXISTS "storico_delete_agente_rivenditore" ON public.profili_specializzazione_storico;

DROP POLICY IF EXISTS "storico_update_agenzia_rivenditore" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_update_agenzia_rivenditore"
  ON public.profili_specializzazione_storico
  FOR UPDATE
  USING (
    sezione IN ('espositori', 'box')
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'agenzia'
    )
    AND EXISTS (
      SELECT 1 FROM public.profili r
      WHERE r.id = profili_specializzazione_storico.profilo_id
        AND r.ruolo = 'rivenditore'
        AND (
          r.invitato_da = auth.uid()
          OR r.invitato_da IN (
            SELECT id FROM public.profili
            WHERE invitato_da = auth.uid() AND ruolo = 'agente'
          )
          OR EXISTS (
            SELECT 1 FROM public.connessioni_utente_operatore c
            WHERE (c.utente_id = r.id AND c.operatore_id = auth.uid())
               OR (c.operatore_id = r.id AND c.utente_id = auth.uid())
          )
        )
    )
  )
  WITH CHECK (
    sezione IN ('espositori', 'box')
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'agenzia'
    )
  );

DROP POLICY IF EXISTS "storico_delete_agenzia_rivenditore" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_delete_agenzia_rivenditore"
  ON public.profili_specializzazione_storico
  FOR DELETE
  USING (
    sezione IN ('espositori', 'box')
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'agenzia'
    )
    AND EXISTS (
      SELECT 1 FROM public.profili r
      WHERE r.id = profili_specializzazione_storico.profilo_id
        AND r.ruolo = 'rivenditore'
        AND (
          r.invitato_da = auth.uid()
          OR r.invitato_da IN (
            SELECT id FROM public.profili
            WHERE invitato_da = auth.uid() AND ruolo = 'agente'
          )
          OR EXISTS (
            SELECT 1 FROM public.connessioni_utente_operatore c
            WHERE (c.utente_id = r.id AND c.operatore_id = auth.uid())
               OR (c.operatore_id = r.id AND c.utente_id = auth.uid())
          )
        )
    )
  );
