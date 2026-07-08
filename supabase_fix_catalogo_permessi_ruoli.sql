-- Aggiunge agenzia e manager ai ruoli_visibili dei cataloghi esistenti.
-- Esegui nel SQL Editor di Supabase se la griglia permessi risulta vuota.

-- Aggiunge agente/agenzia ai cataloghi Family e linee pubbliche che non li hanno.
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'agente')
WHERE categoria IN (
  'Family 15', 'Family 20', 'Family Gres', 'Capsule Collection', 'Bricks',
  'Family 15 Fotografico', 'Family 20 Fotografico', 'Capsule Collection Fotografico',
  'Family Gres Fotografico', 'Bricks Fotografico'
)
AND NOT ('agente' = ANY (ruoli_visibili));

UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'agenzia')
WHERE 'agente' = ANY (ruoli_visibili)
  AND NOT ('agenzia' = ANY (ruoli_visibili));

-- Agenzia: stessi cataloghi dell'agente
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'agenzia')
WHERE 'agente' = ANY (ruoli_visibili)
  AND NOT ('agenzia' = ANY (ruoli_visibili));

-- Manager: visibilità operativa sui cataloghi standard
UPDATE public.cataloghi
SET ruoli_visibili = array_append(ruoli_visibili, 'manager')
WHERE NOT ('manager' = ANY (ruoli_visibili))
  AND (
    array_length(ruoli_visibili, 1) IS NULL
    OR array_length(ruoli_visibili, 1) = 0
    OR ruoli_visibili && ARRAY['free', 'agente', 'distributore', 'studio', 'partner_dipendente']::text[]
  );

-- Popola array vuoti (cataloghi pre-migrazione)
UPDATE public.cataloghi
SET ruoli_visibili = CASE categoria
  WHEN 'Agenti'       THEN ARRAY['agente', 'agenzia', 'manager']::text[]
  WHEN 'Scontistiche' THEN ARRAY['agente', 'agenzia', 'manager']::text[]
  WHEN 'Partner'      THEN ARRAY['distributore', 'studio', 'partner_dipendente', 'manager']::text[]
  WHEN 'Listini'      THEN ARRAY['distributore', 'agente', 'agenzia', 'manager']::text[]
  WHEN 'Studio'       THEN ARRAY['studio', 'partner_dipendente', 'manager']::text[]
  ELSE                     ARRAY['free', 'agente', 'agenzia', 'distributore', 'studio', 'partner_dipendente', 'manager']::text[]
END
WHERE array_length(ruoli_visibili, 1) IS NULL
   OR array_length(ruoli_visibili, 1) = 0;
