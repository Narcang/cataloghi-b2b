-- Regioni coperte da una sede e colore del velo sulla mappa.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS aree_interesse text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS colore_area text;

COMMENT ON COLUMN public.profili.aree_interesse IS 'Codici ISTAT delle regioni coperte dalla sede.';
COMMENT ON COLUMN public.profili.colore_area IS 'Colore del velo in mappa: blu, verde, arancione, viola, azzurro.';
