-- Quantità per ogni voce di specializzazione:
-- campioni/cataloghi (agenzia) ed espositori/box show room (rivenditore).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS agenzia_campione_1_qta INTEGER,
  ADD COLUMN IF NOT EXISTS agenzia_campione_2_qta INTEGER,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_1_qta INTEGER,
  ADD COLUMN IF NOT EXISTS agenzia_catalogo_2_qta INTEGER,
  ADD COLUMN IF NOT EXISTS espositore_1_qta INTEGER,
  ADD COLUMN IF NOT EXISTS espositore_2_qta INTEGER,
  ADD COLUMN IF NOT EXISTS box_show_room_1_qta INTEGER,
  ADD COLUMN IF NOT EXISTS box_show_room_2_qta INTEGER,
  ADD COLUMN IF NOT EXISTS box_show_room_3_qta INTEGER,
  ADD COLUMN IF NOT EXISTS box_show_room_4_qta INTEGER;

COMMENT ON COLUMN public.profili.agenzia_campione_1_qta IS 'Agenzia: quantità primo campione';
COMMENT ON COLUMN public.profili.agenzia_campione_2_qta IS 'Agenzia: quantità secondo campione';
COMMENT ON COLUMN public.profili.agenzia_catalogo_1_qta IS 'Agenzia: quantità primo catalogo';
COMMENT ON COLUMN public.profili.agenzia_catalogo_2_qta IS 'Agenzia: quantità secondo catalogo';
COMMENT ON COLUMN public.profili.espositore_1_qta IS 'Rivenditore: quantità primo espositore';
COMMENT ON COLUMN public.profili.espositore_2_qta IS 'Rivenditore: quantità secondo espositore';
COMMENT ON COLUMN public.profili.box_show_room_1_qta IS 'Rivenditore: quantità box show room 01';
COMMENT ON COLUMN public.profili.box_show_room_2_qta IS 'Rivenditore: quantità box show room 02';
COMMENT ON COLUMN public.profili.box_show_room_3_qta IS 'Rivenditore: quantità box show room 03';
COMMENT ON COLUMN public.profili.box_show_room_4_qta IS 'Rivenditore: quantità box show room 04';
