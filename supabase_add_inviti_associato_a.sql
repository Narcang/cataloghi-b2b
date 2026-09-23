-- Colonna `associato_a` sugli inviti: per admin/manager, il profilo
-- (agenzia / rivenditore / sede studio) a cui associare chi si registra.
-- Se NULL, l'associazione si fa a mano dopo. Esegui nel SQL Editor di Supabase.

ALTER TABLE public.inviti
  ADD COLUMN IF NOT EXISTS associato_a UUID REFERENCES public.profili(id) ON DELETE SET NULL;
