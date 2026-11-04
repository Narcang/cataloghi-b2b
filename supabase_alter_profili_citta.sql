-- Città della sede e coordinate per la mappa (agenzia, rivenditore, sede studio).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS citta text,
  ADD COLUMN IF NOT EXISTS latitudine double precision,
  ADD COLUMN IF NOT EXISTS longitudine double precision;

COMMENT ON COLUMN public.profili.citta IS 'Città della sede, usata per il puntino in mappa.';
COMMENT ON COLUMN public.profili.latitudine IS 'Latitudine ricavata dalla città.';
COMMENT ON COLUMN public.profili.longitudine IS 'Longitudine ricavata dalla città.';
