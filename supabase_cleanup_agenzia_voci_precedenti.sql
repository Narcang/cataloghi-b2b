-- Pulizia dei valori "campioni"/"cataloghi" agenzia non più validi dopo il rename opzioni.
-- Nuove opzioni:
--   Strumenti lavoro agente (campioni): 'VALIGIA AGENTI', 'FOLDER'
--   Cataloghi: 'Family 15', 'Family 20', 'Capsule Collection', 'Brick', 'Family Gres'
-- Azzera valore + quantità + data delle voci con testo non più in elenco.

-- Campioni / Strumenti lavoro agente (slot 1)
UPDATE public.profili
SET agenzia_campione_1 = NULL, agenzia_campione_1_qta = NULL, agenzia_campione_1_data = NULL
WHERE agenzia_campione_1 IS NOT NULL
  AND agenzia_campione_1 NOT IN ('VALIGIA AGENTI', 'FOLDER');

-- Campioni / Strumenti lavoro agente (slot 2)
UPDATE public.profili
SET agenzia_campione_2 = NULL, agenzia_campione_2_qta = NULL, agenzia_campione_2_data = NULL
WHERE agenzia_campione_2 IS NOT NULL
  AND agenzia_campione_2 NOT IN ('VALIGIA AGENTI', 'FOLDER');

-- Cataloghi (slot 1)
UPDATE public.profili
SET agenzia_catalogo_1 = NULL, agenzia_catalogo_1_qta = NULL, agenzia_catalogo_1_data = NULL
WHERE agenzia_catalogo_1 IS NOT NULL
  AND agenzia_catalogo_1 NOT IN ('Family 15', 'Family 20', 'Capsule Collection', 'Brick', 'Family Gres');

-- Cataloghi (slot 2)
UPDATE public.profili
SET agenzia_catalogo_2 = NULL, agenzia_catalogo_2_qta = NULL, agenzia_catalogo_2_data = NULL
WHERE agenzia_catalogo_2 IS NOT NULL
  AND agenzia_catalogo_2 NOT IN ('Family 15', 'Family 20', 'Capsule Collection', 'Brick', 'Family Gres');
