-- ==========================================
-- SCHEMA DATABASE: CATALOGHI B2B
-- Copia e incolla questo script nel SQL Editor di Supabase.
-- ==========================================

-- 1. Estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabella Profili
CREATE TABLE public.profili (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('admin', 'agente', 'fornitore', 'distributore', 'free', 'studio')),
  nome_completo TEXT,
  telefono TEXT,
  email TEXT,
  societa TEXT,
  area_geografica TEXT,
  registrazione_approvata BOOLEAN NOT NULL DEFAULT true,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Abilitiamo la sicurezza a livello di riga (RLS)
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;


-- 3. Tabella Cataloghi
CREATE TABLE public.cataloghi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titolo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Family 15', 'Family 20', 'Family Gres', 'Capsule Collection', 'Bricks', 'Metal', 'Studio', 'Partner', 'Agenti')),
  url_file TEXT NOT NULL,
  url_immagine TEXT,
  area_geografica_target TEXT[] NOT NULL DEFAULT '{}',
  stato_pubblicazione TEXT DEFAULT 'bozza' CHECK (stato_pubblicazione IN ('bozza', 'attivo')),
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.cataloghi ENABLE ROW LEVEL SECURITY;


-- 4. Tabella Connessioni
CREATE TABLE public.connessioni_agente_fornitore (
  agente_id UUID REFERENCES public.profili(id) ON DELETE CASCADE,
  fornitore_id UUID REFERENCES public.profili(id) ON DELETE CASCADE,
  PRIMARY KEY (agente_id, fornitore_id)
);

ALTER TABLE public.connessioni_agente_fornitore ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.connessioni_utente_operatore (
  utente_id UUID NOT NULL REFERENCES public.profili (id) ON DELETE CASCADE,
  operatore_id UUID NOT NULL REFERENCES public.profili (id) ON DELETE CASCADE,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (utente_id, operatore_id),
  CONSTRAINT connessioni_u_o_distinct CHECK (utente_id <> operatore_id)
);

ALTER TABLE public.connessioni_utente_operatore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connessioni_utente_operatore_select" ON public.connessioni_utente_operatore FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profili p WHERE p.id = auth.uid() AND p.ruolo = 'admin')
  OR utente_id = auth.uid()
  OR operatore_id = auth.uid()
);

CREATE POLICY "connessioni_utente_operatore_admin_insert" ON public.connessioni_utente_operatore FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profili p WHERE p.id = auth.uid() AND p.ruolo = 'admin'));

CREATE POLICY "connessioni_utente_operatore_admin_delete" ON public.connessioni_utente_operatore FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profili p WHERE p.id = auth.uid() AND p.ruolo = 'admin')
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- POLICY PROFILI
-- Per ora, per facilitare il frontend, ogni utente loggato può leggere i profili.
CREATE POLICY "I profili sono visibili agli utenti loggati" ON public.profili
  FOR SELECT USING (auth.role() = 'authenticated');
  
-- L'admin può modificare tutti i profili
CREATE POLICY "Admin gestisce tutti i profili" ON public.profili
  FOR ALL USING ( 
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND ruolo = 'admin') 
  );

-- POLICY CATALOGHI
-- 1) Admin ha accesso totale ai cataloghi
CREATE POLICY "Admin ha accesso totale ai cataloghi" ON public.cataloghi
  FOR ALL USING ( 
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND ruolo = 'admin') 
  );
  
-- 2) Agenti, Distributori e Free vedono SOLO cataloghi 'attivi' ED esattamente della loro area geografica target
CREATE POLICY "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo' AND 
    EXISTS (
      SELECT 1 FROM public.profili 
      WHERE id = auth.uid() 
      AND ruolo IN ('agente', 'distributore', 'free')
      AND area_geografica = ANY(cataloghi.area_geografica_target)
    )
  );

-- Puoi aggiungere ulteriori policy per il 'fornitore' se necessario.


-- ==========================================
-- EVENT TRIGGERS (Auto-creazione del Profilo)
-- ==========================================
-- Questa funzione viene lanciata in automatico quando crei un nuovo utente in Supabase (Auth).
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  is_self boolean := (new.raw_user_meta_data->>'registration_flow') = 'portale_self';
  nome text := coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), '');
  cognome text := coalesce(nullif(trim(new.raw_user_meta_data->>'cognome'), ''), '');
  societa text := nullif(trim(new.raw_user_meta_data->>'societa'), '');
  telef text := nullif(trim(new.raw_user_meta_data->>'telefono'), '');
  full_name text;
BEGIN
  IF is_self THEN
    full_name := trim(both ' ' from (nome || ' ' || cognome));
    IF full_name = '' THEN
      full_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'nome_completo'), ''),
        split_part(new.email, '@', 1)
      );
    END IF;
    INSERT INTO public.profili (id, ruolo, email, nome_completo, telefono, societa, registrazione_approvata)
    VALUES (new.id, 'free', new.email, full_name, telef, societa, false);
  ELSE
    INSERT INTO public.profili (id, ruolo, email, nome_completo, registrazione_approvata)
    VALUES (new.id, 'agente', new.email, new.raw_user_meta_data->>'nome_completo', true);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creazione del trigger fisico
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FINE =======================================
