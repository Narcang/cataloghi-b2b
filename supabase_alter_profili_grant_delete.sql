-- Consenti scritture admin su `profili` (PostgREST).
-- Senza GRANT, anche con policy RLS admin: "permission denied for table profili".
-- Preferisci lo script completo: supabase_alter_admin_grants_profili_connessioni.sql

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profili TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profili TO service_role;
