-- Lingua del file catalogo (tutte le lingue UI).
-- Non separa gli utenti: login e associati restano unici.
-- Esegui sul SQL Editor del progetto IT.

ALTER TABLE public.cataloghi
  ADD COLUMN IF NOT EXISTS lingua text;

UPDATE public.cataloghi
SET lingua = 'it'
WHERE lingua IS NULL OR btrim(lingua) = '';

ALTER TABLE public.cataloghi
  ALTER COLUMN lingua SET DEFAULT 'it';

ALTER TABLE public.cataloghi
  ALTER COLUMN lingua SET NOT NULL;

ALTER TABLE public.cataloghi
  DROP CONSTRAINT IF EXISTS cataloghi_lingua_check;

ALTER TABLE public.cataloghi
  ADD CONSTRAINT cataloghi_lingua_check
  CHECK (lingua IN ('it', 'ru', 'en', 'fr', 'de', 'el', 'pl', 'uk'));
