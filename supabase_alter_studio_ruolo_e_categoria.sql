-- Ruolo profilo `studio` + categoria catalogo `Studio` + RLS lettura cataloghi per utenti studio.
-- Esegui nel SQL Editor di Supabase (progetto già migrato con Partner/Agenti).

-- 1) Profili: consenti ruolo `studio`
ALTER TABLE public.profili DROP CONSTRAINT IF EXISTS profili_ruolo_check;

ALTER TABLE public.profili
  ADD CONSTRAINT profili_ruolo_check
  CHECK (
    ruolo IN (
      'admin',
      'agente',
      'fornitore',
      'distributore',
      'free',
      'studio'
    )
  );

-- 2) Cataloghi: aggiungi categoria `Studio` al CHECK
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
      'Studio',
      'Partner',
      'Agenti'
    )
  );

-- 3) RLS: utenti `studio` vedono solo cataloghi attivi nelle categorie base + Studio (stessa regola area dei free)
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
