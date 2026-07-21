-- Campi campioni e cataloghi per profili agenzia (gestione admin).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS agenzia_campione_1 TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_campione_2 TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_1 TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_2 TEXT;

COMMENT ON COLUMN public.profili.agenzia_campione_1 IS 'Agenzia: prima scelta campioni (menu admin)';
COMMENT ON COLUMN public.profili.agenzia_campione_2 IS 'Agenzia: seconda scelta campioni (menu admin)';
COMMENT ON COLUMN public.profili.agenzia_catalogo_1 IS 'Agenzia: primo catalogo di specializzazione';
COMMENT ON COLUMN public.profili.agenzia_catalogo_2 IS 'Agenzia: secondo catalogo di specializzazione';
