-- ================================================================
-- FIX: rimuove la policy che dava accesso pubblico totale agli anonimi.
--
-- La policy "Cataloghi attivi visibili in pubblico" (TO anon)
-- mostrava TUTTI i cataloghi attivi agli utenti non loggati,
-- ignorando completamente ruoli_visibili.
--
-- Da eseguire nel SQL Editor di Supabase.
-- ================================================================

-- Rimuove la policy permissiva precedente
DROP POLICY IF EXISTS "Cataloghi attivi visibili in pubblico" ON public.cataloghi;

-- Controlla che "Cataloghi pubblici (anon)" esista già (creata da supabase_fix_rls_ruoli_catalogo.sql).
-- Se non esiste, la ricrea:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'cataloghi'
      AND policyname = 'Cataloghi pubblici (anon)'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Cataloghi pubblici (anon)" ON public.cataloghi
        FOR SELECT USING (
          stato_pubblicazione = 'attivo'
          AND auth.uid() IS NULL
          AND 'free' = ANY (ruoli_visibili)
        )
    $pol$;
  END IF;
END;
$$;
