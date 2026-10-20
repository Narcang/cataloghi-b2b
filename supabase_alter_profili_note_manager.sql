-- Note interne di admin e area manager, solo per agenzia e agente.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS note_manager text;

COMMENT ON COLUMN public.profili.note_manager IS 'Note interne admin/area manager su agenzia e agente. In struttura si aprono come lo storico.';
