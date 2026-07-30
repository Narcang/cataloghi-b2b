-- Voci extra / nascoste per i menu a tendina di specializzazione profilo.
-- tipo 'extra' = voce aggiunta da admin; 'nascosta' = voce di base rimossa dall'elenco.

CREATE TABLE IF NOT EXISTS public.profili_specializzazione_opzioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('campioni', 'cataloghi', 'espositori', 'box')),
  etichetta TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('extra', 'nascosta')),
  creato_il TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da UUID REFERENCES public.profili(id) ON DELETE SET NULL,
  UNIQUE (categoria, etichetta)
);

CREATE INDEX IF NOT EXISTS profili_specializzazione_opzioni_categoria_idx
  ON public.profili_specializzazione_opzioni (categoria);

COMMENT ON TABLE public.profili_specializzazione_opzioni IS
  'Configurazione voci menu specializzazione: extra aggiunte o voci base nascoste da admin.';

ALTER TABLE public.profili_specializzazione_opzioni ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profili_specializzazione_opzioni TO service_role;
GRANT SELECT ON public.profili_specializzazione_opzioni TO authenticated;

DROP POLICY IF EXISTS "opzioni_select_privileged" ON public.profili_specializzazione_opzioni;
CREATE POLICY "opzioni_select_privileged"
  ON public.profili_specializzazione_opzioni
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profili p
      WHERE p.id = auth.uid()
        AND p.ruolo IN ('admin', 'manager', 'agenzia', 'agente')
    )
  );

GRANT INSERT, UPDATE, DELETE ON public.profili_specializzazione_opzioni TO authenticated;

DROP POLICY IF EXISTS "opzioni_write_admin" ON public.profili_specializzazione_opzioni;
CREATE POLICY "opzioni_write_admin"
  ON public.profili_specializzazione_opzioni
  FOR ALL
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
