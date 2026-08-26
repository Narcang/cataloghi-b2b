-- Permessi tabella cataloghi per service_role (e conferma authenticated/anon).
-- Serve se da admin IT si monitora il mercato Russia (client service role sul progetto RU),
-- oppure se un job server legge cataloghi senza sessione utente.
--
-- Esegui sul SQL Editor del progetto interessato (IT e/o RU).
-- Non tocca i dati, solo i privilegi.

GRANT SELECT ON TABLE public.cataloghi TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cataloghi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cataloghi TO service_role;
