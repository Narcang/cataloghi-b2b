-- Ultima visita e ultima telefonata, solo per agenzia e agente (gestione manager).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS giro_visita date,
  ADD COLUMN IF NOT EXISTS telefonata date;

COMMENT ON COLUMN public.profili.giro_visita IS 'Agenzia/agente: data ultimo giro visita. Rossa dopo 90 giorni.';
COMMENT ON COLUMN public.profili.telefonata IS 'Agenzia/agente: data ultima telefonata. Rossa dopo 10 giorni.';
