-- Data (testo, inserita manualmente) per ogni voce di specializzazione:
-- campioni/cataloghi (agenzia) ed espositori/box show room (rivenditore).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS agenzia_campione_1_data TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_campione_2_data TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_1_data TEXT,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_2_data TEXT,
  ADD COLUMN IF NOT EXISTS espositore_1_data TEXT,
  ADD COLUMN IF NOT EXISTS espositore_2_data TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_1_data TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_2_data TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_3_data TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_4_data TEXT;

COMMENT ON COLUMN public.profili.agenzia_campione_1_data IS 'Agenzia: data (manuale) primo campione';
COMMENT ON COLUMN public.profili.agenzia_campione_2_data IS 'Agenzia: data (manuale) secondo campione';
COMMENT ON COLUMN public.profili.agenzia_catalogo_1_data IS 'Agenzia: data (manuale) primo catalogo';
COMMENT ON COLUMN public.profili.agenzia_catalogo_2_data IS 'Agenzia: data (manuale) secondo catalogo';
COMMENT ON COLUMN public.profili.espositore_1_data IS 'Rivenditore: data (manuale) primo espositore';
COMMENT ON COLUMN public.profili.espositore_2_data IS 'Rivenditore: data (manuale) secondo espositore';
COMMENT ON COLUMN public.profili.box_show_room_1_data IS 'Rivenditore: data (manuale) box show room 01';
COMMENT ON COLUMN public.profili.box_show_room_2_data IS 'Rivenditore: data (manuale) box show room 02';
COMMENT ON COLUMN public.profili.box_show_room_3_data IS 'Rivenditore: data (manuale) box show room 03';
COMMENT ON COLUMN public.profili.box_show_room_4_data IS 'Rivenditore: data (manuale) box show room 04';
