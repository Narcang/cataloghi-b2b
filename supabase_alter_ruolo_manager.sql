-- Aggiunge il ruolo "manager" al portale cataloghi.
-- Manager: può vedere tutti gli utenti e tutti i cataloghi (sola lettura);
-- non può modificare/creare cataloghi né editare utenti.
-- Esegui nel SQL Editor di Supabase.

-- 1. Aggiorna il vincolo CHECK sulla tabella profili
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

-- 2. Policy RLS cataloghi: il manager vede tutti i cataloghi (attivi e bozze),
--    in tutte le aree, come l'admin.
--    La policy admin esistente usa current_user_is_admin(); ne aggiungiamo una
--    dedicata al manager per non toccare la funzione esistente.
DROP POLICY IF EXISTS "Manager can select all cataloghi" ON public.cataloghi;

CREATE POLICY "Manager can select all cataloghi" ON public.cataloghi
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
        AND ruolo = 'manager'
    )
  );

-- 3. Policy RLS profili: il manager può leggere tutti i profili
--    (la policy admin già copre SELECT * dove ruolo='admin'; ne aggiungiamo una per manager).
DROP POLICY IF EXISTS "Manager can select all profili" ON public.profili;

CREATE POLICY "Manager can select all profili" ON public.profili
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profili AS me
      WHERE me.id = auth.uid()
        AND me.ruolo = 'manager'
    )
  );

-- 4. Policy RLS storage cataloghi (bucket): il manager può leggere tutti gli oggetti.
--    Controlla se esiste già una policy admin simile e aggiungi il manager.
DROP POLICY IF EXISTS "Manager can read all storage objects" ON storage.objects;

CREATE POLICY "Manager can read all storage objects" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cataloghi'
    AND EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
        AND ruolo = 'manager'
    )
  );
