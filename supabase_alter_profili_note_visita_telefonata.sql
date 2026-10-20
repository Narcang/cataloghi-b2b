-- Una nota breve per il giro visita e una per la telefonata.
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS note_visita text,
  ADD COLUMN IF NOT EXISTS note_telefonata text;

-- La nota unica già salvata resta sul giro visita.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profili'
      AND column_name = 'note_manager'
  ) THEN
    UPDATE public.profili
    SET note_visita = note_manager
    WHERE note_manager IS NOT NULL
      AND btrim(note_manager) <> ''
      AND (note_visita IS NULL OR btrim(note_visita) = '');
  END IF;
END $$;

COMMENT ON COLUMN public.profili.note_visita IS 'Nota breve admin/area manager sul giro visita di agenzia o agente.';
COMMENT ON COLUMN public.profili.note_telefonata IS 'Nota breve admin/area manager sulla telefonata di agenzia o agente.';
