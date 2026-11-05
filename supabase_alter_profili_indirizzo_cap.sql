-- Via e CAP della sede, usati insieme alla città per il puntino in mappa.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS indirizzo text,
  ADD COLUMN IF NOT EXISTS cap text;

COMMENT ON COLUMN public.profili.indirizzo IS 'Via e numero civico della sede.';
COMMENT ON COLUMN public.profili.cap IS 'CAP della sede.';
