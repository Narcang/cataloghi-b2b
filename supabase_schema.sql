-- ==========================================
-- SCHEMA DATABASE: CATALOGHI B2B
-- Copia e incolla questo script nel SQL Editor di Supabase.
-- ==========================================

-- 1. Estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabella Profili
CREATE TABLE public.profili (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('admin', 'agente', 'fornitore', 'distributore', 'free')),
  nome_completo TEXT,
  telefono TEXT,
  email TEXT,
  area_geografica TEXT,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Abilitiamo la sicurezza a livello di riga (RLS)
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;


-- 3. Tabella Cataloghi
CREATE TABLE public.cataloghi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titolo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Family 15', 'Family 20', 'Family Gres', 'Capsule Collection', 'Bricks', 'Metal')),
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
BEGIN
  INSERT INTO public.profili (id, ruolo, email, nome_completo)
  -- Per default assegniamo ruolo 'agente', l'admin potrà cambiarlo a mano dal DB.
  VALUES (new.id, 'agente', new.email, new.raw_user_meta_data->>'nome_completo');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creazione del trigger fisico
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FINE =======================================
