-- =============================================================
-- MERGE: Partner + Listini Netti → Listini
-- Eseguire in Supabase SQL Editor
-- =============================================================

-- 1. Aggiorna la categoria dei cataloghi esistenti
UPDATE public.cataloghi
SET categoria = 'Listini'
WHERE categoria IN ('Partner', 'Listini Netti');

-- 2. Aggiorna il CHECK constraint su cataloghi.categoria
--    (aggiunge 'Listini', mantiene le vecchie per sicurezza)
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
      'Listini',
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

-- 3. Assicura che i cataloghi Listini abbiano ruoli_visibili corretti
--    (distributore + agente + manager, se il campo è vuoto o null)
UPDATE public.cataloghi
SET ruoli_visibili = ARRAY['distributore', 'agente', 'manager']
WHERE categoria = 'Listini'
  AND (ruoli_visibili IS NULL OR array_length(ruoli_visibili, 1) = 0);
