-- Storico delle sezioni di specializzazione:
--   agenzia: 'campioni', 'cataloghi'
--   rivenditore: 'espositori', 'box'
-- Ogni riga è uno snapshot dello stato PRECEDENTE al salvataggio (voci con quantità e data).
CREATE TABLE IF NOT EXISTS public.profili_specializzazione_storico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profilo_id UUID NOT NULL REFERENCES public.profili(id) ON DELETE CASCADE,
  sezione TEXT NOT NULL CHECK (sezione IN ('campioni', 'cataloghi', 'espositori', 'box')),
  -- voci: [{ "valore": "...", "quantita": 12, "data": "27/07/2026" }, ...]
  voci JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Data automatica (aggiornato_il) associata allo snapshot precedente, se presente.
  aggiornato_il_precedente TIMESTAMPTZ,
  creato_il TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da UUID
);

CREATE INDEX IF NOT EXISTS profili_specializzazione_storico_profilo_sezione_idx
  ON public.profili_specializzazione_storico (profilo_id, sezione, creato_il DESC);

COMMENT ON TABLE public.profili_specializzazione_storico IS 'Storico snapshot delle sezioni campioni/cataloghi (agenzia) ed espositori/box (rivenditore).';

-- RLS: lettura consentita a admin e manager; inserimento consentito ad admin.
-- (Le scritture normalmente avvengono dal server con service role, ma teniamo la policy
--  come fallback quando il service role non è configurato.)
ALTER TABLE public.profili_specializzazione_storico ENABLE ROW LEVEL SECURITY;

-- Permessi di tabella per il ruolo delle sessioni utente autenticate.
GRANT SELECT, INSERT ON public.profili_specializzazione_storico TO authenticated;

DROP POLICY IF EXISTS "storico_select_admin_manager" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_select_admin_manager"
  ON public.profili_specializzazione_storico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "storico_insert_admin" ON public.profili_specializzazione_storico;
CREATE POLICY "storico_insert_admin"
  ON public.profili_specializzazione_storico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid() AND p.ruolo = 'admin'
    )
  );
