-- Campi espositori e box show room per profili rivenditore (gestione admin).
ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS espositore_1 TEXT,
  ADD COLUMN IF NOT EXISTS espositore_2 TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_1 TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_2 TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_3 TEXT,
  ADD COLUMN IF NOT EXISTS box_show_room_4 TEXT;

COMMENT ON COLUMN public.profili.espositore_1 IS 'Rivenditore: prima scelta espositore (menu admin)';
COMMENT ON COLUMN public.profili.espositore_2 IS 'Rivenditore: seconda scelta espositore (menu admin)';
COMMENT ON COLUMN public.profili.box_show_room_1 IS 'Rivenditore: Box Show Room 01';
COMMENT ON COLUMN public.profili.box_show_room_2 IS 'Rivenditore: Box Show Room 02';
COMMENT ON COLUMN public.profili.box_show_room_3 IS 'Rivenditore: Box Show Room 03';
COMMENT ON COLUMN public.profili.box_show_room_4 IS 'Rivenditore: Box Show Room 04';
