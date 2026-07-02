-- ================================================================
-- Permessi catalogo per singolo utente
--
-- Da eseguire nel SQL Editor di Supabase.
-- Crea la tabella di whitelist per-utente e aggiorna la RLS
-- sulla tabella cataloghi per rispettarla.
-- ================================================================

-- ----------------------------------------------------------------
-- STEP 1 – Crea la tabella catalogo_permessi_utente
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalogo_permessi_utente (
  utente_id  UUID NOT NULL,
  catalogo_id UUID NOT NULL REFERENCES public.cataloghi(id) ON DELETE CASCADE,
  creato_da  UUID,
  creato_il  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (utente_id, catalogo_id)
);

CREATE INDEX IF NOT EXISTS idx_cpu_utente ON public.catalogo_permessi_utente (utente_id);

-- RLS: gli utenti leggono solo i propri permessi (scrittura via service role)
ALTER TABLE public.catalogo_permessi_utente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpu_self_read" ON public.catalogo_permessi_utente;
CREATE POLICY "cpu_self_read" ON public.catalogo_permessi_utente
  FOR SELECT TO authenticated
  USING (utente_id = auth.uid());

-- ----------------------------------------------------------------
-- STEP 2 – Aggiorna la RLS di cataloghi per rispettare la whitelist
-- ----------------------------------------------------------------

-- Rimuove la policy autenticati precedente
DROP POLICY IF EXISTS "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi;

-- Ricrea con il controllo aggiuntivo per-utente:
--   se l'utente ha voci in catalogo_permessi_utente → vede solo quelle
--   altrimenti → vede tutti i cataloghi del suo ruolo (comportamento attuale)
CREATE POLICY "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profili
      WHERE id = auth.uid()
        AND ruolo = ANY (cataloghi.ruoli_visibili)
    )
    AND (
      -- Nessuna restrizione personale impostata → visibili tutti i cataloghi del ruolo
      NOT EXISTS (
        SELECT 1 FROM public.catalogo_permessi_utente
        WHERE utente_id = auth.uid()
      )
      OR
      -- Restrizioni presenti → vede solo i cataloghi abilitati
      EXISTS (
        SELECT 1 FROM public.catalogo_permessi_utente
        WHERE utente_id = auth.uid()
          AND catalogo_id = cataloghi.id
      )
    )
  );
