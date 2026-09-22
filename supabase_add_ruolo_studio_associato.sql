-- Ruolo `studio_associato` (etichetta UI: Studio), sotto Sede Studio (`studio`).
-- Stessi poteri catalogo della sede: si aggiunge a ruoli_visibili dove c’è già `studio`.
-- I profili esistenti con ruolo `studio` restano Sede Studio (nessuna migrazione dati).
-- Esegui nel SQL Editor di Supabase.

ALTER TABLE public.profili
  DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN (
      'admin', 'manager', 'agenzia', 'agente', 'back_office', 'rivenditore', 'distributore',
      'studio', 'studio_associato', 'partner_dipendente',
      'free', 'fornitore'
    ));

UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'studio_associato')
WHERE 'studio' = ANY(ruoli_visibili)
  AND NOT ('studio_associato' = ANY(ruoli_visibili));
