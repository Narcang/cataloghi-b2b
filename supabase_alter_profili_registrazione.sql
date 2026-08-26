-- Registrazione self-service: società, flag approvazione admin, trigger profilo e RLS cataloghi.
-- Esegui nel SQL Editor di Supabase dopo le altre migrazioni su `profili` / `cataloghi`.

-- 1) Colonne profilo
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS societa TEXT;

ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS registrazione_approvata BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profili.registrazione_approvata IS
  'Se false, l''utente ha richiesto accesso dal portale e attende conferma admin (nessun catalogo riservato).';

COMMENT ON COLUMN public.profili.societa IS 'Ragione sociale / studio indicata in fase di registrazione.';

-- 2) Trigger: self-registration (metadata registration_flow = portale_self).
--    Con invito: ruolo da invito_ruolo; senza invito: free in attesa di approvazione.
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
    VALUES (new.id, 'agente', new.email, new.raw_user_meta_data->>'nome_completo', true);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) RLS cataloghi: utenti con registrazione_approvata = false non vedono cataloghi (admin resta sulla policy separata)
DROP POLICY IF EXISTS "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi;

CREATE POLICY "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
      AND coalesce(registrazione_approvata, true) = true
      AND area_geografica = ANY (cataloghi.area_geografica_target)
      AND (
        ruolo IN ('agente', 'free')
        OR (ruolo = 'distributore' AND cataloghi.categoria <> 'Agenti')
        OR (
          ruolo = 'studio'
          AND cataloghi.categoria IN (
            'Family 15',
            'Family 20',
            'Family Gres',
            'Capsule Collection',
            'Studio'
          )
        )
      )
    )
  );

-- Approvazione manuale (esempio SQL per admin / SQL Editor):
-- UPDATE public.profili
-- SET registrazione_approvata = true, area_geografica = 'MONDO'
-- WHERE email = 'utente@esempio.it';
