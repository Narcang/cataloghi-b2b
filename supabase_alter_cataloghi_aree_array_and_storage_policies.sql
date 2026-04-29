-- Migrazione per DB gia' esistente:
-- 1) assicura colonne cataloghi usate dal frontend
-- 2) converte area_geografica_target in array testo (multi-area)
-- 3) aggiorna policy RLS di lettura cataloghi
-- 4) imposta policy storage su bucket `cataloghi`: upload solo admin

-- 1) Colonne mancanti (compatibilita' con schema vecchio)
ALTER TABLE public.cataloghi
ADD COLUMN IF NOT EXISTS url_immagine TEXT;

-- IMPORTANTE:
-- Prima rimuoviamo la policy che dipende da `area_geografica_target`,
-- altrimenti Postgres blocca ALTER COLUMN TYPE.
DROP POLICY IF EXISTS "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi;

-- 2) Conversione colonna aree
ALTER TABLE public.cataloghi
ALTER COLUMN area_geografica_target TYPE text[]
USING (
  CASE
    WHEN area_geografica_target IS NULL OR btrim(area_geografica_target) = '' THEN ARRAY[]::text[]
    ELSE ARRAY[btrim(area_geografica_target)]
  END
);

ALTER TABLE public.cataloghi
ALTER COLUMN area_geografica_target SET DEFAULT '{}';

ALTER TABLE public.cataloghi
ALTER COLUMN area_geografica_target SET NOT NULL;

-- 3) Aggiornamento policy cataloghi (area utente dentro array aree target)
CREATE POLICY "RLS Cataloghi per Agenti, Distributori e Free" ON public.cataloghi
  FOR SELECT USING (
    stato_pubblicazione = 'attivo'
    AND EXISTS (
      SELECT 1
      FROM public.profili
      WHERE id = auth.uid()
      AND ruolo IN ('agente', 'distributore', 'free')
      AND area_geografica = ANY(cataloghi.area_geografica_target)
    )
  );

-- 4) Storage policies (bucket cataloghi)
-- Nota: se il bucket non esiste, crealo prima da UI o SQL.
-- INSERT non puo' usare policy FOR ALL, servono policy separate.

DROP POLICY IF EXISTS "Cataloghi read authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Cataloghi upload admin" ON storage.objects;
DROP POLICY IF EXISTS "Cataloghi update admin" ON storage.objects;
DROP POLICY IF EXISTS "Cataloghi delete admin" ON storage.objects;

CREATE POLICY "Cataloghi read authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cataloghi');

CREATE POLICY "Cataloghi upload admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cataloghi'
  AND EXISTS (
    SELECT 1
    FROM public.profili
    WHERE id = auth.uid()
      AND ruolo = 'admin'
  )
);

CREATE POLICY "Cataloghi update admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cataloghi'
  AND EXISTS (
    SELECT 1
    FROM public.profili
    WHERE id = auth.uid()
      AND ruolo = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'cataloghi'
  AND EXISTS (
    SELECT 1
    FROM public.profili
    WHERE id = auth.uid()
      AND ruolo = 'admin'
  )
);

CREATE POLICY "Cataloghi delete admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cataloghi'
  AND EXISTS (
    SELECT 1
    FROM public.profili
    WHERE id = auth.uid()
      AND ruolo = 'admin'
  )
);
