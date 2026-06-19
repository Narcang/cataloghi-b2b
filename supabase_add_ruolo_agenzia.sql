-- 1. Estendi il CHECK constraint su profili.ruolo
ALTER TABLE public.profili
  DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN (
      'admin', 'manager', 'agenzia', 'agente', 'distributore',
      'studio', 'partner_dipendente',
      'free', 'fornitore'
    ));

-- 2. Aggiungi agenzia a ruoli_visibili dove c'è già agente
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'agenzia')
WHERE 'agente' = ANY(ruoli_visibili)
  AND NOT ('agenzia' = ANY(ruoli_visibili));
