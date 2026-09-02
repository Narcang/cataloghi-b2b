-- Consenti PDF catalogo in tutte le lingue UI (IT RU EN FR DE EL PL UK).
-- Esegui sul SQL Editor del progetto IT (e RU se usi ancora quell’archivio).

ALTER TABLE public.cataloghi
  DROP CONSTRAINT IF EXISTS cataloghi_lingua_check;

ALTER TABLE public.cataloghi
  ADD CONSTRAINT cataloghi_lingua_check
  CHECK (lingua IN ('it', 'ru', 'en', 'fr', 'de', 'el', 'pl', 'uk'));
