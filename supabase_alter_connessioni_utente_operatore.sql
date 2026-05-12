-- Collega utenti (profili) agli operatori abilitati (agenti / partner distributori).
-- Esegui nel SQL Editor di Supabase.

CREATE TABLE IF NOT EXISTS public.connessioni_utente_operatore (
  utente_id UUID NOT NULL REFERENCES public.profili (id) ON DELETE CASCADE,
  operatore_id UUID NOT NULL REFERENCES public.profili (id) ON DELETE CASCADE,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (utente_id, operatore_id),
  CONSTRAINT connessioni_u_o_distinct CHECK (utente_id <> operatore_id)
);

ALTER TABLE public.connessioni_utente_operatore ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.connessioni_utente_operatore IS
  'Operatori (agente/distributore) associati a un profilo utente; visibili nella rubrica contatti del portale.';

-- Lettura: admin, il profilo utente, o l''operatore collegato
DROP POLICY IF EXISTS "connessioni_utente_operatore_select" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_select" ON public.connessioni_utente_operatore FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.profili p
      WHERE
        p.id = auth.uid()
        AND p.ruolo = 'admin'
    )
    OR utente_id = auth.uid()
    OR operatore_id = auth.uid()
  );

-- Scrittura: solo admin (la dashboard admin usa sessione autenticata)
DROP POLICY IF EXISTS "connessioni_utente_operatore_admin_insert" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_admin_insert" ON public.connessioni_utente_operatore FOR INSERT TO authenticated
WITH
  CHECK (
    EXISTS (
      SELECT 1
      FROM public.profili p
      WHERE
        p.id = auth.uid()
        AND p.ruolo = 'admin'
    )
  );

DROP POLICY IF EXISTS "connessioni_utente_operatore_admin_delete" ON public.connessioni_utente_operatore;

CREATE POLICY "connessioni_utente_operatore_admin_delete" ON public.connessioni_utente_operatore FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.profili p
    WHERE
      p.id = auth.uid()
      AND p.ruolo = 'admin'
  )
);
