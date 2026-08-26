-- Ripristina handle_new_user() per leggere il ruolo dall'invito.
-- Su installazioni nuove, supabase_alter_profili_registrazione.sql può aver
-- sovrascritto la versione di supabase_alter_inviti.sql: in quel caso ogni
-- registrazione (anche con token manager/agente/...) finisce come 'free'.
-- Eseguire su Supabase Russia (e Italia se gli inviti assegnano free).

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
