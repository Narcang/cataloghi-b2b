-- Date ultimo aggiornamento campioni/cataloghi (agenzia) e espositori/box (rivenditore).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS agenzia_campioni_aggiornato_il TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agenzia_cataloghi_aggiornato_il TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS espositori_aggiornato_il TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS box_aggiornato_il TIMESTAMPTZ;

COMMENT ON COLUMN public.profili.agenzia_campioni_aggiornato_il IS 'Ultimo salvataggio campioni agenzia (admin)';
COMMENT ON COLUMN public.profili.agenzia_cataloghi_aggiornato_il IS 'Ultimo salvataggio cataloghi agenzia (admin)';
COMMENT ON COLUMN public.profili.espositori_aggiornato_il IS 'Ultimo salvataggio espositori rivenditore (admin)';
COMMENT ON COLUMN public.profili.box_aggiornato_il IS 'Ultimo salvataggio box rivenditore (admin)';
