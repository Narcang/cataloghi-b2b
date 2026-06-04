-- Aggiunge "manager" come ruolo selezionabile per la visibilità dei cataloghi.
-- L'admin continua a vedere tutto tramite la propria policy.
-- Esegui nel SQL Editor di Supabase DOPO supabase_alter_ruoli_catalogo.sql.

-- ============================================================
-- 1. Aggiunge 'manager' ai cataloghi esistenti che non ce l'hanno
-- ============================================================
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'manager')
WHERE NOT ('manager' = ANY (ruoli_visibili));

-- ============================================================
-- 2. Rimuove la policy "Manager vede tutto" (ora il manager
--    vede solo i cataloghi in cui è esplicitamente selezionato,
--    come qualsiasi altro ruolo)
-- ============================================================
DROP POLICY IF EXISTS "Manager can select all cataloghi" ON public.cataloghi;

-- La policy "Cataloghi visibili per ruolo (autenticati)" già creata
-- in supabase_alter_ruoli_catalogo.sql gestisce ora anche il manager
-- tramite: ruolo = ANY (cataloghi.ruoli_visibili)

-- ============================================================
-- 3. (Facoltativo) Rimuove anche la policy sui profili e storage
--    se vuoi che il manager acceda solo ai profili selezionati.
--    Lascia commentato se vuoi che il manager veda ancora tutti
--    i profili nella gestione utenti.
-- ============================================================
-- DROP POLICY IF EXISTS "Manager can select all profili" ON public.profili;
-- DROP POLICY IF EXISTS "Manager can read all storage objects" ON storage.objects;
