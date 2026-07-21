-- Rivenditore: referente agente/utente inserito manualmente dall'admin.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS seguito_da TEXT;

COMMENT ON COLUMN public.profili.seguito_da IS 'Rivenditore: nome agente o referente (testo libero, gestione admin)';
