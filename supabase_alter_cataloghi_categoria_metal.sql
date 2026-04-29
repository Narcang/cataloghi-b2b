-- Aggiunge la categoria "Metal" al vincolo CHECK su cataloghi.categoria
-- Esegui su Supabase SQL Editor se il DB era stato creato con la lista senza Metal.

ALTER TABLE cataloghi DROP CONSTRAINT IF EXISTS cataloghi_categoria_check;

ALTER TABLE cataloghi
  ADD CONSTRAINT cataloghi_categoria_check
  CHECK (categoria IN ('Family 15', 'Family 20', 'Family Gres', 'Capsule Collection', 'Bricks', 'Metal'));
