-- Ejecutar en el SQL Editor de Supabase antes de desplegar los cambios.
BEGIN;
ALTER TABLE happycheese.stores ADD COLUMN IF NOT EXISTS "googleReviewUrl" TEXT;
ALTER TABLE happycheese.flavors ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;
ALTER TABLE happycheese.flavors ADD COLUMN IF NOT EXISTS "customBasesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE happycheese.flavors ADD COLUMN IF NOT EXISTS "customBases" JSONB NOT NULL DEFAULT '[]'::jsonb;

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id)::integer - 1 AS position
  FROM happycheese.flavors
)
UPDATE happycheese.flavors f SET "sortOrder" = ranked.position
FROM ranked WHERE ranked.id = f.id AND f."sortOrder" IS NULL;
ALTER TABLE happycheese.flavors ALTER COLUMN "sortOrder" SET DEFAULT 2147483647;
CREATE INDEX IF NOT EXISTS idx_flavors_sort ON happycheese.flavors ("sortOrder", "createdAt", id);

-- Evitar guardados parciales y detectar altas/bajas mientras se edita el orden.
CREATE OR REPLACE FUNCTION happycheese.reorder_flavors(flavor_ids TEXT[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = happycheese, pg_temp AS $$
BEGIN
  LOCK TABLE happycheese.flavors IN SHARE ROW EXCLUSIVE MODE;
  IF cardinality(flavor_ids) IS DISTINCT FROM (SELECT count(*)::integer FROM happycheese.flavors)
     OR cardinality(flavor_ids) IS DISTINCT FROM (SELECT count(DISTINCT supplied.id)::integer FROM unnest(flavor_ids) AS supplied(id))
     OR EXISTS (SELECT 1 FROM unnest(flavor_ids) AS supplied(id) WHERE supplied.id IS NULL OR NOT EXISTS (SELECT 1 FROM happycheese.flavors f WHERE f.id = supplied.id)) THEN
    RAISE EXCEPTION 'El catálogo ha cambiado. Recarga los sabores antes de ordenar.';
  END IF;
  UPDATE happycheese.flavors f SET "sortOrder" = ordered.position::integer - 1, "updatedAt" = now()
  FROM unnest(flavor_ids) WITH ORDINALITY ordered(id, position) WHERE f.id = ordered.id;
END;
$$;
REVOKE ALL ON FUNCTION happycheese.reorder_flavors(TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION happycheese.reorder_flavors(TEXT[]) TO service_role;

-- Mantener coherencia con el aviso de 36 h, respetando límites superiores.
UPDATE happycheese.stores SET "pickupSettings" = jsonb_set(
  COALESCE("pickupSettings", '{}'::jsonb), '{minNoticeHours}', '36'::jsonb
) WHERE COALESCE(("pickupSettings"->>'minNoticeHours')::numeric, 0) < 36;
COMMIT;
NOTIFY pgrst, 'reload schema';
