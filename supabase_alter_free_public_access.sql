-- Accesso pubblico (utente Free senza login) a:
-- - cataloghi attivi
-- - contatti diretti (agenti/partner)

-- Cataloghi attivi visibili anche ad anon
DROP POLICY IF EXISTS "Cataloghi attivi visibili in pubblico" ON public.cataloghi;

CREATE POLICY "Cataloghi attivi visibili in pubblico"
ON public.cataloghi
FOR SELECT
TO anon
USING (
  stato_pubblicazione = 'attivo'
);

-- Contatti diretti pubblici: profili agenti e partner (distributori)
DROP POLICY IF EXISTS "Contatti diretti pubblici" ON public.profili;

CREATE POLICY "Contatti diretti pubblici"
ON public.profili
FOR SELECT
TO anon
USING (
  ruolo IN ('agente', 'distributore')
  AND area_geografica IS NOT NULL
  AND length(trim(area_geografica)) > 0
);

-- Stessa rubrica per sessioni authenticated (es. ruolo free): così dopo login/logout
-- la query dashboard vede gli stessi agenti/partner che vede l'ospite senza password.
-- Se esiste già una policy larga "tutti i profili ai loggati", questa è ridondante ma innocua.
DROP POLICY IF EXISTS "Contatti diretti pubblici authenticated" ON public.profili;

CREATE POLICY "Contatti diretti pubblici authenticated"
ON public.profili
FOR SELECT
TO authenticated
USING (
  ruolo IN ('agente', 'distributore')
);
