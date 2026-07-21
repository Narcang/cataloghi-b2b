-- Rivenditori invitati da un agente: collega invitato_da all'agenzia (non all'agente).
-- Esegui in Supabase SQL Editor dopo il deploy del codice aggiornato.

UPDATE public.profili AS rivenditore
SET invitato_da = agente.invitato_da
FROM public.profili AS agente
WHERE rivenditore.ruolo = 'rivenditore'
  AND rivenditore.invitato_da = agente.id
  AND agente.ruolo = 'agente'
  AND agente.invitato_da IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profili AS agenzia
    WHERE agenzia.id = agente.invitato_da
      AND agenzia.ruolo = 'agenzia'
  );
