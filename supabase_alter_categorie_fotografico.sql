-- Aggiunge le 3 nuove categorie Fotografico al CHECK constraint della tabella cataloghi.
--
-- Da eseguire nel SQL Editor di Supabase.

-- 1) Rimuove il vecchio constraint
ALTER TABLE public.cataloghi
  DROP CONSTRAINT IF EXISTS cataloghi_categoria_check;

-- 2) Ricrea il constraint con i nuovi valori
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
      'Partner',
      'Agenti',
      'Scontistiche',
      'Family 15 Fotografico',
      'Family 20 Fotografico',
      'Capsule Collection Fotografico'
    )
  );
