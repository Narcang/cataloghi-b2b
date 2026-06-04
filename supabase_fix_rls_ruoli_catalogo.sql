-- ================================================================
-- FIX DEFINITIVO: visibilità catalogo basata su ruoli_visibili.
--
-- Da eseguire nel SQL Editor di Supabase.
-- Sostituisce TUTTE le policy SELECT precedenti (incluse quelle
-- delle migrazioni precedenti che continuavano a concedere accesso).
-- ================================================================

-- ----------------------------------------------------------------
-- STEP 1 – Assicura che la colonna ruoli_visibili esista e sia popolata
-- ----------------------------------------------------------------
ALTER TABLE public.cataloghi
  ADD COLUMN IF NOT EXISTS ruoli_visibili text[] NOT NULL DEFAULT '{}';

-- Popola i cataloghi che hanno ancora array vuoto
UPDATE public.cataloghi
SET ruoli_visibili = CASE categoria
  WHEN 'Agenti'       THEN ARRAY['agente', 'manager']::text[]
  WHEN 'Scontistiche' THEN ARRAY['agente', 'manager']::text[]
  WHEN 'Partner'      THEN ARRAY['distributore', 'studio', 'manager']::text[]
  WHEN 'Studio'       THEN ARRAY['studio', 'manager']::text[]
  ELSE                     ARRAY['free', 'agente', 'distributore', 'studio', 'fornitore', 'manager']::text[]
END
WHERE array_length(ruoli_visibili, 1) IS NULL
   OR array_length(ruoli_visibili, 1) = 0;

-- ----------------------------------------------------------------
-- STEP 2 – Rimuove TUTTE le policy SELECT note (vecchie e nuove)
-- ----------------------------------------------------------------

-- Da supabase_alter_cataloghi_categoria_scontistiche.sql
DROP POLICY IF EXISTS "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi;

-- Da supabase_alter_ruolo_manager.sql
DROP POLICY IF EXISTS "Manager can select all cataloghi" ON public.cataloghi;

-- Da supabase_alter_ruoli_catalogo.sql (precedenti, potrebbero avere bug)
DROP POLICY IF EXISTS "Cataloghi visibili per ruolo (autenticati)" ON public.cataloghi;
DROP POLICY IF EXISTS "Cataloghi pubblici (anon)" ON public.cataloghi;

-- Da supabase_alter_free_public_access.sql (policy anon senza filtro ruoli!)
DROP POLICY IF EXISTS "Cataloghi attivi visibili in pubblico" ON public.cataloghi;

-- Nomi alternativi che potrebbero esistere dallo schema originale
DROP POLICY IF EXISTS "Anyone can view active cataloghi" ON public.cataloghi;
DROP POLICY IF EXISTS "Enable read for all" ON public.cataloghi;
DROP POLICY IF EXISTS "Public can view active cataloghi" ON public.cataloghi;
DROP POLICY IF EXISTS "Authenticated users can view cataloghi" ON public.cataloghi;

-- ----------------------------------------------------------------
-- STEP 3 – Ricrea le policy corrette
-- ----------------------------------------------------------------

-- Utenti autenticati: il loro ruolo deve essere esplicitamente
-- presente in ruoli_visibili del catalogo.
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

-- Utenti NON loggati (anonimi): solo cataloghi con 'free' in ruoli_visibili.
-- auth.uid() IS NULL garantisce che gli utenti autenticati non bypassino
-- il controllo ruolo tramite questa policy.
CREATE POLICY "Cataloghi pubblici (anon)" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND auth.uid() IS NULL
    AND 'free' = ANY (ruoli_visibili)
  );

-- Nota: la policy admin (current_user_is_admin()) dallo schema originale
-- resta invariata e garantisce all'admin accesso completo.
-- La policy manager è stata rimossa: il manager ora vede solo i cataloghi
-- in cui il ruolo 'manager' è spuntato (gestito dalla policy autenticati).
