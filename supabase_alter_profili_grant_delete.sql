-- Consenti DELETE su `profili` per le API (PostgREST).
-- Senza GRANT DELETE, anche con policy RLS admin si ottiene: "permission denied for table profili".
-- Esegui una volta nel SQL Editor di Supabase.

GRANT DELETE ON TABLE public.profili TO authenticated;
GRANT DELETE ON TABLE public.profili TO service_role;
