-- Sistema inviti: link monouso per registrazione utenti con ruolo pre-assegnato.
-- Da eseguire nel SQL Editor di Supabase.

-- ----------------------------------------------------------------
-- STEP 1 – Tabella inviti
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inviti (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token       TEXT NOT NULL UNIQUE,
  creato_da   UUID NOT NULL REFERENCES public.profili(id) ON DELETE CASCADE,
  ruolo_invitato TEXT NOT NULL,
  usato       BOOLEAN NOT NULL DEFAULT false,
  usato_da    UUID REFERENCES public.profili(id) ON DELETE SET NULL,
  creato_il   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  usato_il    TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.inviti ENABLE ROW LEVEL SECURITY;

-- Admin vede tutti; l'invitante vede i propri; accesso pubblico per token (validazione registrazione)
DROP POLICY IF EXISTS "inviti_select_admin_or_owner" ON public.inviti;
CREATE POLICY "inviti_select_admin_or_owner" ON public.inviti
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    OR creato_da = auth.uid()
  );

-- Chiunque autenticato può inserire (la logica di gerarchia è nel codice applicativo)
DROP POLICY IF EXISTS "inviti_insert_authenticated" ON public.inviti;
CREATE POLICY "inviti_insert_authenticated" ON public.inviti
  FOR INSERT TO authenticated
  WITH CHECK (creato_da = auth.uid());

GRANT SELECT, INSERT ON TABLE public.inviti TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.inviti TO service_role;

-- ----------------------------------------------------------------
-- STEP 2 – Colonna invitato_da su profili
-- ----------------------------------------------------------------
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS invitato_da UUID REFERENCES public.profili(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- STEP 3 – Aggiorna handle_new_user() per leggere ruolo e invitato_da da metadata
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_self     boolean := (new.raw_user_meta_data->>'registration_flow') = 'portale_self';
  nome        text := coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), '');
  cognome     text := coalesce(nullif(trim(new.raw_user_meta_data->>'cognome'), ''), '');
  societa     text := nullif(trim(new.raw_user_meta_data->>'societa'), '');
  telef       text := nullif(trim(new.raw_user_meta_data->>'telefono'), '');
  full_name   text;
  invito_ruolo text := nullif(trim(new.raw_user_meta_data->>'invito_ruolo'), '');
  invito_da   uuid;
BEGIN
  BEGIN
    invito_da := (new.raw_user_meta_data->>'invito_da')::uuid;
  EXCEPTION WHEN OTHERS THEN
    invito_da := NULL;
  END;

  IF is_self THEN
    full_name := trim(both ' ' from (nome || ' ' || cognome));
    IF full_name = '' THEN
      full_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'nome_completo'), ''),
        split_part(new.email, '@', 1)
      );
    END IF;
    INSERT INTO public.profili (id, ruolo, email, nome_completo, telefono, societa, registrazione_approvata, invitato_da)
    VALUES (
      new.id,
      COALESCE(invito_ruolo, 'free'),
      new.email,
      full_name,
      telef,
      societa,
      false,
      invito_da
    );
  ELSE
    INSERT INTO public.profili (id, ruolo, email, nome_completo, registrazione_approvata)
    VALUES (new.id, 'agente', new.email, split_part(new.email, '@', 1), true);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
