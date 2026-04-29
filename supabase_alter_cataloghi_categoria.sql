-- Esegui questo script solo se la tabella `cataloghi` esiste gia'
-- e vuoi aggiungere il campo categoria con le macro-categorie richieste.

ALTER TABLE public.cataloghi
ADD COLUMN IF NOT EXISTS categoria TEXT;

UPDATE public.cataloghi
SET categoria = 'Family 15'
WHERE categoria IS NULL;

ALTER TABLE public.cataloghi
ALTER COLUMN categoria SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cataloghi_categoria_check'
  ) THEN
    ALTER TABLE public.cataloghi
    ADD CONSTRAINT cataloghi_categoria_check
    CHECK (categoria IN ('Family 15', 'Family 20', 'Family Gres', 'Capsule Collection', 'Bricks'));
  END IF;
END$$;
