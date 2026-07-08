-- ================================================================
-- HOTFIX URGENTE: permission denied for table catalogo_permessi_utente
--
-- Causa: la tabella è stata creata senza GRANT per il ruolo
-- `authenticated`. La policy RLS su `cataloghi` fa una subquery su
-- questa tabella e fallisce per tutti (inclusi admin).
--
-- Esegui SUBITO nel SQL Editor di Supabase.
-- ================================================================

-- Permessi di base sulla tabella (RLS limita cosa si vede)
GRANT SELECT ON public.catalogo_permessi_utente TO authenticated;
GRANT ALL    ON public.catalogo_permessi_utente TO service_role;

-- Ricrea la policy cataloghi escludendo admin (hanno già policy dedicata)
DROP POLICY IF EXISTS "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi;

CREATE POLICY "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND auth.uid() IS NOT NULL
    AND NOT public.current_user_is_admin()
    AND EXISTS (
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
  );
