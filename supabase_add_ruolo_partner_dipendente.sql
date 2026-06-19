-- Aggiunge il ruolo `partner_dipendente` (stessi permessi di `studio`).
-- Esegui nel SQL Editor di Supabase.

-- 1. Estendi il CHECK constraint su profili.ruolo
ALTER TABLE public.profili
  DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN (
      'admin', 'manager', 'agente', 'distributore',
      'studio', 'partner_dipendente',
      'free', 'fornitore'
    ));

-- 2. Aggiungi partner_dipendente a ruoli_visibili dove c'è già studio
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'partner_dipendente')
WHERE 'studio' = ANY(ruoli_visibili)
  AND NOT ('partner_dipendente' = ANY(ruoli_visibili));
