-- Rimuove le connessioni di test per Nico Studio e Nico Partner Test.
-- Esegui nel SQL Editor di Supabase.

-- Cerca i profili per nome (verifica prima con SELECT)
SELECT id, nome_completo, email, ruolo
FROM public.profili
WHERE nome_completo ILIKE '%nico%'
   OR email ILIKE '%narca@yahoo%'
   OR email ILIKE '%haheyef%'
   OR email ILIKE '%wixspecialist%';

-- Una volta verificati gli id, rimuovi tutti i link di e verso questi profili:
-- (sostituisci gli uuid con quelli restituiti dalla SELECT qui sopra)

-- DELETE FROM public.connessioni_utente_operatore
-- WHERE utente_id IN ('<uuid-nico-studio>', '<uuid-nico-partner-test>')
--    OR operatore_id IN ('<uuid-nico-studio>', '<uuid-nico-partner-test>');
