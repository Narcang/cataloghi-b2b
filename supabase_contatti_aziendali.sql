-- Contatti aziendali → dashboard "I Tuoi Contatti Diretti" (tutti: anon, free, agenti, partner, admin).
-- ESEGUI QUESTO FILE NEL SQL EDITOR DI SUPABASE (progetto collegato all'app), non sul deploy Vercel.
-- Ordine consigliato: 1) esegui questo script fino a OK  2) poi deploy del codice Next.js.

-- UUID nativo PostgreSQL (niente estensione uuid-ossp obbligatoria)
CREATE TABLE IF NOT EXISTS public.contatti_aziendali (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etichetta TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  ordine INTEGER NOT NULL DEFAULT 0,
  attivo BOOLEAN NOT NULL DEFAULT true,
  creato_il TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contatti_aziendali ENABLE ROW LEVEL SECURITY;

-- PostgREST: senza GRANT le policy RLS non bastano (spesso errore "permission denied")
GRANT SELECT ON public.contatti_aziendali TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatti_aziendali TO authenticated;
GRANT ALL ON public.contatti_aziendali TO service_role;

DROP POLICY IF EXISTS "Contatti aziendali lettura anon" ON public.contatti_aziendali;
CREATE POLICY "Contatti aziendali lettura anon"
ON public.contatti_aziendali
FOR SELECT
TO anon
USING (attivo = true);

DROP POLICY IF EXISTS "Contatti aziendali lettura authenticated" ON public.contatti_aziendali;
CREATE POLICY "Contatti aziendali lettura authenticated"
ON public.contatti_aziendali
FOR SELECT
TO authenticated
USING (attivo = true);

DROP POLICY IF EXISTS "Admin gestisce contatti aziendali" ON public.contatti_aziendali;
CREATE POLICY "Admin gestisce contatti aziendali"
ON public.contatti_aziendali
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND ruolo = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND ruolo = 'admin')
);

-- Esempio (opzionale):
-- INSERT INTO public.contatti_aziendali (etichetta, email, ordine) VALUES
--   ('Assistenza cataloghi', 'info@tuodominio.it', 0);
