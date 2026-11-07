-- Ejecutar después de supabase-catalog-improvements-migration.sql.
-- Conserva el orden actual como punto de partida para cada tienda.
BEGIN;
ALTER TABLE happycheese.flavors
  ADD COLUMN IF NOT EXISTS "storeSortOrders" JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH ranked AS (
  SELECT f.id, s.id AS store_id,
    row_number() OVER (PARTITION BY s.id ORDER BY f."sortOrder" NULLS LAST, f."createdAt", f.id) - 1 AS position
  FROM happycheese.flavors f
  JOIN happycheese.stores s ON EXISTS (
    SELECT 1 FROM jsonb_array_elements(f.availability) a
    WHERE a->>'storeId' = s.id AND jsonb_array_length(COALESCE(a->'portions', '[]'::jsonb)) > 0
  )
  -- No volver a inicializar una tienda que ya tiene posiciones guardadas.
  WHERE NOT EXISTS (SELECT 1 FROM happycheese.flavors configured WHERE configured."storeSortOrders" ? s.id)
), initial AS (
  SELECT id, jsonb_object_agg(store_id, position) AS positions FROM ranked GROUP BY id
)
UPDATE happycheese.flavors f SET "storeSortOrders" = initial.positions || f."storeSortOrders"
FROM initial WHERE initial.id = f.id;

CREATE OR REPLACE FUNCTION happycheese.reorder_flavors_for_store(store_id TEXT, flavor_ids TEXT[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = happycheese, pg_temp AS $$
BEGIN
  PERFORM 1 FROM happycheese.stores s WHERE s.id = store_id AND s.active = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tienda no disponible'; END IF;
  LOCK TABLE happycheese.flavors IN SHARE ROW EXCLUSIVE MODE;

  IF flavor_ids IS NULL
     OR cardinality(flavor_ids) IS DISTINCT FROM (
       SELECT count(*)::integer FROM happycheese.flavors f WHERE EXISTS (
         SELECT 1 FROM jsonb_array_elements(f.availability) a
         WHERE a->>'storeId' = store_id AND jsonb_array_length(COALESCE(a->'portions', '[]'::jsonb)) > 0
       )
     )
     OR cardinality(flavor_ids) IS DISTINCT FROM (SELECT count(DISTINCT supplied.id)::integer FROM unnest(flavor_ids) AS supplied(id))
     OR EXISTS (
       SELECT 1 FROM unnest(flavor_ids) AS supplied(id)
       WHERE supplied.id IS NULL OR NOT EXISTS (
         SELECT 1 FROM happycheese.flavors f WHERE f.id = supplied.id AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(f.availability) a
           WHERE a->>'storeId' = store_id AND jsonb_array_length(COALESCE(a->'portions', '[]'::jsonb)) > 0
         )
       )
     ) THEN
    RAISE EXCEPTION 'Los sabores de esta tienda han cambiado. Recarga el catálogo antes de ordenar.';
  END IF;

  -- Actualizar solo la clave de esta tienda. No tocar el orden de las demás,
  -- la disponibilidad, los precios, las bases o el orden global anterior.
  UPDATE happycheese.flavors f
  SET "storeSortOrders" = jsonb_set(COALESCE(f."storeSortOrders", '{}'::jsonb), ARRAY[store_id], to_jsonb(ordered.position::integer - 1), true),
      "updatedAt" = now()
  FROM unnest(flavor_ids) WITH ORDINALITY ordered(id, position)
  WHERE f.id = ordered.id;
END;
$$;
REVOKE ALL ON FUNCTION happycheese.reorder_flavors_for_store(TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION happycheese.reorder_flavors_for_store(TEXT, TEXT[]) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
