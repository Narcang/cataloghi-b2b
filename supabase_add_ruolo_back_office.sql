-- Ruolo back_office: clone di agente, sempre sotto agenzia (stessi poteri).

ALTER TABLE public.profili
  DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN (
      'admin', 'manager', 'agenzia', 'agente', 'back_office', 'rivenditore', 'distributore',
      'studio', 'partner_dipendente',
      'free', 'fornitore'
    ));

-- Allinea visibilità cataloghi: dove c'è agente, aggiungi back_office
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'back_office')
WHERE 'agente' = ANY(ruoli_visibili)
  AND NOT ('back_office' = ANY(ruoli_visibili));

-- Agente / back-office possono aggiornare espositori e box dei rivenditori associati
DROP POLICY IF EXISTS "Agente can update associated rivenditore specialization" ON public.profili;

CREATE POLICY "Agente can update associated rivenditore specialization"
  ON public.profili
  FOR UPDATE
  TO authenticated
  USING (
    ruolo = 'rivenditore'
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('agente', 'back_office')
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

-- Agenzia: anche i rivenditori invitati da back-office
DROP POLICY IF EXISTS "Agenzia can update associated rivenditore specialization" ON public.profili;

CREATE POLICY "Agenzia can update associated rivenditore specialization"
  ON public.profili
  FOR UPDATE
  TO authenticated
  USING (
    ruolo = 'rivenditore'
    AND EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'agenzia'
    )
    AND (
      invitato_da = auth.uid()
      OR invitato_da IN (
        SELECT id FROM public.profili
        WHERE invitato_da = auth.uid() AND ruolo IN ('agente', 'back_office')
      )
      OR EXISTS (
        SELECT 1 FROM public.connessioni_utente_operatore c
        WHERE (c.utente_id = profili.id AND c.operatore_id = auth.uid())
           OR (c.operatore_id = profili.id AND c.utente_id = auth.uid())
      )
    )
  )
  WITH CHECK (ruolo = 'rivenditore');

-- Storico specializzazione: lettura/inserimento anche per back_office
DROP POLICY IF EXISTS "storico_select_admin_manager" ON public.profili_specializzazione_storico;
DROP POLICY IF EXISTS "storico_select_admin_manager_agenzia_agente" ON public.profili_specializzazione_storico;

CREATE POLICY "storico_select_admin_manager_agenzia_agente"
  ON public.profili_specializzazione_storico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente', 'back_office')
    )
  );

DROP POLICY IF EXISTS "storico_insert_admin_manager_agenzia" ON public.profili_specializzazione_storico;
DROP POLICY IF EXISTS "storico_insert_admin_manager_agenzia_agente" ON public.profili_specializzazione_storico;

CREATE POLICY "storico_insert_admin_manager_agenzia_agente"
  ON public.profili_specializzazione_storico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente', 'back_office')
    )
  );

-- Opzioni specializzazione: lettura anche per back_office
DROP POLICY IF EXISTS "opzioni_select_privileged" ON public.profili_specializzazione_opzioni;
CREATE POLICY "opzioni_select_privileged"
  ON public.profili_specializzazione_opzioni
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid()
        AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente', 'back_office')
    )
  );

-- Storico agenzia: rivenditori invitati anche da back-office
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
            WHERE invitato_da = auth.uid() AND ruolo IN ('agente', 'back_office')
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
            WHERE invitato_da = auth.uid() AND ruolo IN ('agente', 'back_office')
          )
          OR EXISTS (
            SELECT 1 FROM public.connessioni_utente_operatore c
            WHERE (c.utente_id = r.id AND c.operatore_id = auth.uid())
               OR (c.operatore_id = r.id AND c.utente_id = auth.uid())
          )
        )
    )
  );
