-- Consenti PDF catalogo in tutte le lingue UI (IT RU EN ES FR DE NL EL PL UK).
-- Esegui sul SQL Editor del progetto IT (e RU se usi ancora quell’archivio).

ALTER TABLE public.cataloghi
  DROP CONSTRAINT IF EXISTS cataloghi_lingua_check;

ALTER TABLE public.cataloghi
  ADD CONSTRAINT cataloghi_lingua_check
  CHECK (lingua IN ('it', 'ru', 'en', 'es', 'fr', 'de', 'nl', 'el', 'pl', 'uk'));
