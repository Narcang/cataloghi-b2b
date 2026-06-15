-- Assistenza Ladiva → card "I Tuoi Contatti Diretti"
-- Esegui nel SQL Editor di Supabase.

UPDATE public.contatti_aziendali
SET
  etichetta = 'Assistenza Ladiva',
  telefono = COALESCE(NULLIF(TRIM(telefono), ''), '+39 0536 185 6217')
WHERE etichetta IN ('Assistenza cataloghi', 'Assistenza Ladiva')
   OR email = 'info@ladiva-fpd.com';

-- Se la riga non esiste ancora:
-- INSERT INTO public.contatti_aziendali (etichetta, email, telefono, ordine)
-- VALUES ('Assistenza Ladiva', 'info@ladiva-fpd.com', '+39 0536 185 6217', 0);
