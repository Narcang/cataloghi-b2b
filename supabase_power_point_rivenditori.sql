-- I Power Point del portale sono visibili a tutti i rivenditori,
-- anche se il catalogo non aveva il ruolo spuntato
-- e anche se il rivenditore ha un elenco cataloghi personale.
--
-- Da eseguire nel SQL Editor di Supabase.

UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'rivenditore')
WHERE categoria = 'Power Point'
  AND NOT ('rivenditore' = ANY (ruoli_visibili));

DROP POLICY IF EXISTS "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi;

CREATE POLICY "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND auth.uid() IS NOT NULL
    AND NOT public.current_user_is_admin()
    AND (
      (
        categoria = 'Power Point'
        AND EXISTS (
          SELECT 1 FROM public.profili
          WHERE id = auth.uid()
            AND ruolo = 'rivenditore'
        )
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.profili
          WHERE id = auth.uid()
            AND ruolo = ANY (cataloghi.ruoli_visibili)
        )
        AND (
          NOT EXISTS (
            SELECT 1 FROM public.catalogo_permessi_utente
            WHERE utente_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.catalogo_permessi_utente
            WHERE utente_id = auth.uid()
              AND catalogo_id = cataloghi.id
          )
        )
      )
    )
  );
