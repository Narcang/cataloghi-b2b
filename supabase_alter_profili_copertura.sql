-- Nazione intera e città coperte, oltre alle regioni già presenti.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS nazioni_interesse text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS citta_coperte text,
  ADD COLUMN IF NOT EXISTS citta_coperte_geo jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profili.nazioni_interesse IS 'Nazioni coperte per intero, quando non si scelgono regioni.';
COMMENT ON COLUMN public.profili.citta_coperte IS 'Città coperte, separate da virgola. Se presenti, in mappa restano solo queste.';
COMMENT ON COLUMN public.profili.citta_coperte_geo IS 'Coordinate delle città coperte: [{nome, lat, lng}].';
