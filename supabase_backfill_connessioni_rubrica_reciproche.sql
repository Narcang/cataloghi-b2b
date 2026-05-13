-- Opzionale: dopo il deploy dell'app, eseguire una volta per creare la riga inversa
-- dove manca (solo tra agente, distributore/partner e studio).
-- Così chi era collegato solo in una direzione vede comunque email/telefono dell'altro.

INSERT INTO public.connessioni_utente_operatore (utente_id, operatore_id)
SELECT c.operatore_id, c.utente_id
FROM public.connessioni_utente_operatore c
JOIN public.profili pu ON pu.id = c.utente_id
JOIN public.profili po ON po.id = c.operatore_id
WHERE pu.ruolo IN ('agente', 'distributore', 'studio')
  AND po.ruolo IN ('agente', 'distributore', 'studio')
  AND NOT EXISTS (
    SELECT 1
    FROM public.connessioni_utente_operatore x
    WHERE
      x.utente_id = c.operatore_id
      AND x.operatore_id = c.utente_id
  )
ON CONFLICT DO NOTHING;
