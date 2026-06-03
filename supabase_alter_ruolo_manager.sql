-- Aggiunge il ruolo "manager" al portale cataloghi.
-- Manager: può vedere tutti gli utenti e tutti i cataloghi (sola lettura);
-- non può modificare/creare cataloghi né editare utenti.
-- Esegui nel SQL Editor di Supabase.

-- ============================================================
-- 1. Aggiorna il vincolo CHECK sulla tabella profili
-- ============================================================
ALTER TABLE public.profili DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
  CHECK (
    ruolo IN (
      'admin',
      'manager',
      'agente',
      'fornitore',
      'distributore',
      'free',
      'studio'
    )
  );

-- ============================================================
-- 2. Funzione helper SECURITY DEFINER (bypassa la RLS)
--    Analogia di current_user_is_admin() già presente nello schema.
--    SECURITY DEFINER esegue la query come il proprietario della funzione
--    (senza RLS attiva), evitando la ricorsione infinita.
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili
    WHERE id = auth.uid()
      AND ruolo = 'manager'
  );
$$;

-- ============================================================
-- 3. Policy RLS cataloghi: il manager vede TUTTI i cataloghi
--    (attivi e bozze, tutte le aree), come l'admin.
-- ============================================================
DROP POLICY IF EXISTS "Manager can select all cataloghi" ON public.cataloghi;

CREATE POLICY "Manager can select all cataloghi" ON public.cataloghi
  FOR SELECT USING (public.current_user_is_manager());

-- ============================================================
-- 4. Policy RLS profili: il manager può leggere tutti i profili.
--    NOTA: usa current_user_is_manager() (SECURITY DEFINER) per
--    evitare la ricorsione infinita che si verificherebbe con
--    una sottoquery diretta su profili dentro una policy di profili.
-- ============================================================
DROP POLICY IF EXISTS "Manager can select all profili" ON public.profili;

CREATE POLICY "Manager can select all profili" ON public.profili
  FOR SELECT USING (public.current_user_is_manager());

-- ============================================================
-- 5. Policy RLS storage (bucket cataloghi): il manager può leggere
--    tutti gli oggetti (ZIP e PDF), necessario per il download.
-- ============================================================
DROP POLICY IF EXISTS "Manager can read all storage objects" ON storage.objects;

CREATE POLICY "Manager can read all storage objects" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cataloghi'
    AND public.current_user_is_manager()
  );
