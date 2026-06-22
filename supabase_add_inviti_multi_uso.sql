-- Aggiunge la colonna multi_uso alla tabella inviti
-- Se multi_uso = true il link non viene marcato come usato e può essere usato da più persone
ALTER TABLE public.inviti
  ADD COLUMN IF NOT EXISTS multi_uso boolean NOT NULL DEFAULT false;
