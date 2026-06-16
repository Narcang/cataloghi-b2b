-- Pulizia connessioni di test
-- Esegui nel SQL Editor di Supabase.

-- ─── STEP 1: trova l'UUID del partner "Link invito partner" ───────────────────
SELECT id, nome_completo, ruolo
FROM public.profili
WHERE email = 'haheyef192@lidugw.com';

-- ─── STEP 2: rimuovi i link partner → studi (connessioni manuali di test) ─────
-- Sostituisci <uuid-link-invito-partner> con il valore trovato nello step 1.

DELETE FROM public.connessioni_utente_operatore c
USING public.profili p
WHERE c.operatore_id = p.id
  AND p.ruolo = 'studio'
  AND c.utente_id = '<uuid-link-invito-partner>';

-- Rimuovi anche il lato inverso (studi → partner) se presente:
DELETE FROM public.connessioni_utente_operatore c
USING public.profili p
WHERE c.utente_id = p.id
  AND p.ruolo = 'studio'
  AND c.operatore_id = '<uuid-link-invito-partner>';

-- ─── Pulizia precedente (Nico Studio, Nico Partner Test, Nico Link) ───────────
-- Queste righe erano già state eseguite; riportate qui per documentazione.
-- DELETE FROM public.connessioni_utente_operatore
-- WHERE utente_id IN (
--     'c0622f94-f580-4e62-a896-f082a69a691d',  -- Nico Studio
--     'a1bc1c1d-e313-44cb-8e11-fe428be7c61f',  -- Nico Partner Test
--     '55fc6875-5643-4e1c-a2a0-d7880f1e5073'   -- Nico Link
--   )
--    OR operatore_id IN (
--     'c0622f94-f580-4e62-a896-f082a69a691d',
--     'a1bc1c1d-e313-44cb-8e11-fe428be7c61f',
--     '55fc6875-5643-4e1c-a2a0-d7880f1e5073'
--   );
