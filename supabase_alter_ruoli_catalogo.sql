-- Visibilità catalogo basata su ruoli anziché area geografica.
-- Esegui nel SQL Editor di Supabase.

-- ============================================================
-- 1. Aggiunge la colonna ruoli_visibili
-- ============================================================
ALTER TABLE public.cataloghi
  ADD COLUMN IF NOT EXISTS ruoli_visibili text[] NOT NULL DEFAULT '{}';

-- ============================================================
-- 2. Popola i cataloghi esistenti in base alla categoria
--    (mantiene la stessa logica di visibilità già in uso)
-- ============================================================
UPDATE public.cataloghi
SET ruoli_visibili = CASE categoria
  WHEN 'Agenti'       THEN ARRAY['agente']::text[]
  WHEN 'Scontistiche' THEN ARRAY['agente']::text[]
  WHEN 'Partner'      THEN ARRAY['distributore', 'studio']::text[]
  WHEN 'Studio'       THEN ARRAY['studio']::text[]
  ELSE                     ARRAY['free', 'agente', 'distributore', 'studio', 'fornitore']::text[]
END
WHERE array_length(ruoli_visibili, 1) IS NULL
   OR array_length(ruoli_visibili, 1) = 0;

-- ============================================================
-- 3. Sostituisce la vecchia policy area+ruolo con una semplice
--    policy basata su ruoli_visibili
-- ============================================================
DROP POLICY IF EXISTS "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi;
DROP POLICY IF EXISTS "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi;
DROP POLICY IF EXISTS "Cataloghi pubblici (anon)" ON public.cataloghi;

-- Utenti autenticati: il loro ruolo deve essere in ruoli_visibili
CREATE POLICY "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
        AND ruolo = ANY (cataloghi.ruoli_visibili)
    )
  );

-- Utenti anonimi / non loggati: catalogo deve avere 'free' in ruoli_visibili
CREATE POLICY "Cataloghi pubblici (anon)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND 'free' = ANY (ruoli_visibili)
  );

-- Nota: le policy admin (current_user_is_admin) e manager (current_user_is_manager)
-- già esistenti restano invariate e garantiscono l'accesso completo ai rispettivi ruoli.
