-- Telefono assistenza cataloghi → card "I Tuoi Contatti Diretti"
-- Esegui nel SQL Editor di Supabase.

UPDATE public.contatti_aziendali
SET telefono = '+39 0536 185 6217'
WHERE etichetta = 'Assistenza cataloghi'
   OR email = 'info@ladiva-fpd.com';

-- Se la riga non esiste ancora:
-- INSERT INTO public.contatti_aziendali (etichetta, email, telefono, ordine)
-- VALUES ('Assistenza cataloghi', 'info@ladiva-fpd.com', '+39 0536 185 6217', 0);
