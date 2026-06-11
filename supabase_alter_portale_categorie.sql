-- Aggiunge le nuove categorie del portale al CHECK constraint della tabella cataloghi
-- e imposta i ruoli_visibili di default per ognuna.
--
-- Da eseguire nel SQL Editor di Supabase.

-- 1) Aggiorna il CHECK constraint per includere le nuove categorie
ALTER TABLE public.cataloghi
  DROP CONSTRAINT IF EXISTS cataloghi_categoria_check;

ALTER TABLE public.cataloghi
  ADD CONSTRAINT cataloghi_categoria_check CHECK (
    categoria IN (
      'Family 15',
      'Family 20',
      'Family Gres',
      'Capsule Collection',
      'Bricks',
      'Metal',
      'Studio',
      'File 2D',
      'File 3D',
      'Partner',
      'Agenti',
      'Scontistiche',
      'Listini Netti',
      'Power Point',
      'Family 15 Fotografico',
      'Family 20 Fotografico',
      'Capsule Collection Fotografico',
      'Family Gres Fotografico',
      'Bricks Fotografico'
    )
  );

-- 2) Aggiorna ruoli_visibili per eventuali cataloghi già inseriti nelle nuove categorie
-- (precauzione: in genere sono appena create, quindi non ci sono righe da aggiornare)
UPDATE public.cataloghi
SET ruoli_visibili = ARRAY['studio', 'distributore', 'agente', 'manager']::text[]
WHERE categoria IN ('File 2D', 'File 3D')
  AND (array_length(ruoli_visibili, 1) IS NULL OR array_length(ruoli_visibili, 1) = 0);

UPDATE public.cataloghi
SET ruoli_visibili = ARRAY['agente', 'manager']::text[]
WHERE categoria IN ('Power Point', 'Listini Netti')
  AND (array_length(ruoli_visibili, 1) IS NULL OR array_length(ruoli_visibili, 1) = 0);
