-- Due cataloghi aggiuntivi per le agenzie (slot 3 e 4), con quantità e data.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_3 TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_4 TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_3_qta INTEGER,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_4_qta INTEGER,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_3_data TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_4_data TEXT;

COMMENT ON COLUMN public.profili.agenzia_catalogo_3 IS 'Agenzia: terzo catalogo di specializzazione';
COMMENT ON COLUMN public.profili.agenzia_catalogo_4 IS 'Agenzia: quarto catalogo di specializzazione';
COMMENT ON COLUMN public.profili.agenzia_catalogo_3_qta IS 'Agenzia: quantità terzo catalogo';
COMMENT ON COLUMN public.profili.agenzia_catalogo_4_qta IS 'Agenzia: quantità quarto catalogo';
COMMENT ON COLUMN public.profili.agenzia_catalogo_3_data IS 'Agenzia: data (manuale) terzo catalogo';
COMMENT ON COLUMN public.profili.agenzia_catalogo_4_data IS 'Agenzia: data (manuale) quarto catalogo';
