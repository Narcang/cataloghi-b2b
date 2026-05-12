-- Aggiunge categorie "Partner" e "Agenti" al CHECK su cataloghi.categoria
-- e aggiorna la policy RLS: i distributori (partner B2B) non possono fare SELECT
-- sui cataloghi con categoria = 'Agenti' (riservati agli agenti).

ALTER TABLE public.cataloghi DROP CONSTRAINT IF EXISTS cataloghi_categoria_check;

ALTER TABLE public.cataloghi
  ADD CONSTRAINT cataloghi_categoria_check
  CHECK (
    categoria IN (
      'Family 15',
      'Family 20',
      'Family Gres',
      'Capsule Collection',
      'Bricks',
      'Metal',
      'Partner',
      'Agenti'
    )
  );

DROP POLICY IF EXISTS "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi;

CREATE POLICY "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
      AND area_geografica = ANY (cataloghi.area_geografica_target)
      AND (
        ruolo IN ('agente', 'free')
        OR (ruolo = 'distributore' AND cataloghi.categoria <> 'Agenti')
      )
    )
  );
