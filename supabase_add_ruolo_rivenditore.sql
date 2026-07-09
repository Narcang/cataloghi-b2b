-- Ruolo rivenditore (Rivenditori): stessi permessi catalogo/portale del distributore (Venditori).

ALTER TABLE public.profili
  DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN (
      'admin', 'manager', 'agenzia', 'agente', 'rivenditore', 'distributore',
      'studio', 'partner_dipendente',
      'free', 'fornitore'
    ));

-- Allinea visibilità cataloghi: dove c'è distributore, aggiungi rivenditore
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'rivenditore')
WHERE 'distributore' = ANY(ruoli_visibili)
  AND NOT ('rivenditore' = ANY(ruoli_visibili));
