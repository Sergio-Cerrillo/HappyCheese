-- Ejecutar después de las migraciones de catálogo y pagos, antes de desplegar.
-- Volver a ejecutarla actualiza la validación de las fechas de recogida y conserva las reservas y ventas.
BEGIN;

ALTER TABLE happycheese.flavors ADD COLUMN IF NOT EXISTS "limitedEdition" JSONB;

-- El historial pertenece a una edición concreta. No depende de cambios posteriores
-- en el nombre, tamaño, base o estado de preparación del pedido.
CREATE TABLE IF NOT EXISTS happycheese."flavorReservations" (
  "orderId" TEXT NOT NULL,
  "flavorId" TEXT NOT NULL,
  "editionId" TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  state TEXT NOT NULL CHECK (state IN ('reserved', 'sold', 'released')),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("orderId", "flavorId")
);
CREATE INDEX IF NOT EXISTS flavor_reservations_edition
  ON happycheese."flavorReservations" ("flavorId", "editionId", state);
CREATE INDEX IF NOT EXISTS flavor_reservations_pending
  ON happycheese."flavorReservations" ("expiresAt") WHERE state = 'reserved';
ALTER TABLE happycheese."flavorReservations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON happycheese."flavorReservations" FROM PUBLIC, anon, authenticated;
GRANT ALL ON happycheese."flavorReservations" TO service_role;

CREATE OR REPLACE FUNCTION happycheese.prepare_limited_edition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = happycheese, pg_temp AS $$
DECLARE
  edition JSONB := NEW."limitedEdition";
  edition_id TEXT;
  used_units BIGINT;
BEGIN
  IF edition IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN edition_id := OLD."limitedEdition"->>'id'; END IF;
  IF jsonb_typeof(edition) <> 'object' OR jsonb_typeof(edition->'enabled') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'LIMITED_EDITION: Configuración de edición no válida';
  END IF;
  IF edition->>'startsOn' IS NOT NULL AND edition->>'endsOn' IS NOT NULL
     AND (edition->>'startsOn')::date > (edition->>'endsOn')::date THEN
    RAISE EXCEPTION 'LIMITED_EDITION: Revisa las fechas de la edición';
  END IF;
  IF edition->>'maxUnits' IS NOT NULL AND (
    jsonb_typeof(edition->'maxUnits') <> 'number' OR
    (edition->>'maxUnits')::numeric <> trunc((edition->>'maxUnits')::numeric) OR
    (edition->>'maxUnits')::numeric NOT BETWEEN 1 AND 100000
  ) THEN RAISE EXCEPTION 'LIMITED_EDITION: El límite debe ser un número entero positivo'; END IF;
  IF (edition->>'enabled')::boolean THEN
    IF edition->>'endsOn' IS NULL AND edition->>'maxUnits' IS NULL THEN
      RAISE EXCEPTION 'LIMITED_EDITION: Define una fecha final o un límite de unidades';
    END IF;
    edition_id := COALESCE(edition_id, gen_random_uuid()::text);
    SELECT COALESCE(sum(quantity), 0) INTO used_units FROM happycheese."flavorReservations"
      WHERE "flavorId" = NEW.id AND "editionId" = edition_id AND state <> 'released';
    IF edition->>'maxUnits' IS NOT NULL AND used_units > (edition->>'maxUnits')::integer THEN
      RAISE EXCEPTION 'LIMITED_EDITION: El límite no puede ser inferior a las unidades vendidas y reservadas (%)', used_units;
    END IF;
    NEW."limitedEdition" := jsonb_set(edition, '{id}', to_jsonb(edition_id));
  ELSIF edition_id IS NOT NULL THEN
    NEW."limitedEdition" := jsonb_set(edition, '{id}', to_jsonb(edition_id));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prepare_limited_edition ON happycheese.flavors;
CREATE TRIGGER prepare_limited_edition BEFORE INSERT OR UPDATE OF "limitedEdition"
  ON happycheese.flavors FOR EACH ROW EXECUTE FUNCTION happycheese.prepare_limited_edition();

CREATE OR REPLACE FUNCTION happycheese.reserve_limited_flavors()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = happycheese, pg_temp AS $$
DECLARE
  requested RECORD;
  flavor happycheese.flavors%ROWTYPE;
  edition JSONB;
  used_units BIGINT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.items IS DISTINCT FROM OLD.items AND EXISTS (
      SELECT 1 FROM happycheese."flavorReservations" WHERE "orderId" = NEW.id
    ) THEN RAISE EXCEPTION 'LIMITED_EDITION: No se pueden cambiar los productos de un pedido reservado'; END IF;
    IF NEW."pickupDate" IS DISTINCT FROM OLD."pickupDate" AND EXISTS (
      SELECT 1 FROM happycheese."flavorReservations" r
      JOIN happycheese.flavors f ON f.id = r."flavorId"
      WHERE r."orderId" = NEW.id AND COALESCE((f."limitedEdition"->>'enabled')::boolean, false)
        AND ((f."limitedEdition"->>'startsOn')::date > NEW."pickupDate"::date
          OR (f."limitedEdition"->>'endsOn')::date < NEW."pickupDate"::date)
    ) THEN RAISE EXCEPTION 'LIMITED_EDITION: La fecha de recogida debe estar dentro del período de los sabores exclusivos'; END IF;
    -- Un fallo de tarjeta puede reintentarse dentro de la misma sesión. Únicamente
    -- Stripe confirmado como caducado o reembolsado libera la reserva.
    IF NEW."paymentStatus" IN ('paid', 'partially_refunded') THEN
      UPDATE happycheese."flavorReservations" SET state = 'sold' WHERE "orderId" = NEW.id;
    ELSIF NEW."paymentStatus" IN ('expired', 'refunded') THEN
      UPDATE happycheese."flavorReservations" SET state = 'released' WHERE "orderId" = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  -- Un bloqueo por sabor serializa la comprobación y la reserva. El orden estable
  -- evita interbloqueos cuando dos carritos contienen los mismos sabores.
  FOR requested IN
    SELECT item->>'flavorId' AS id, sum((item->>'quantity')::integer) AS quantity
    FROM jsonb_array_elements(NEW.items) item GROUP BY item->>'flavorId' ORDER BY item->>'flavorId'
  LOOP
    SELECT * INTO flavor FROM happycheese.flavors WHERE id = requested.id FOR UPDATE;
    IF NOT FOUND OR NOT flavor.active THEN
      RAISE EXCEPTION 'LIMITED_EDITION: Uno de los sabores ya no está disponible';
    END IF;
    edition := flavor."limitedEdition";
    IF NOT COALESCE((edition->>'enabled')::boolean, false) THEN CONTINUE; END IF;
    IF (edition->>'startsOn')::date > NEW."pickupDate"::date OR (edition->>'endsOn')::date < NEW."pickupDate"::date THEN
      RAISE EXCEPTION 'LIMITED_EDITION: La fecha de recogida de % debe estar dentro de su período disponible', flavor.name;
    END IF;
    SELECT COALESCE(sum(quantity), 0) INTO used_units FROM happycheese."flavorReservations"
      WHERE "flavorId" = flavor.id AND "editionId" = edition->>'id' AND state <> 'released';
    IF edition->>'maxUnits' IS NOT NULL AND used_units + requested.quantity > (edition->>'maxUnits')::integer THEN
      RAISE EXCEPTION 'LIMITED_EDITION: % solo tiene % unidades disponibles', flavor.name,
        greatest(0, (edition->>'maxUnits')::integer - used_units);
    END IF;
    INSERT INTO happycheese."flavorReservations" ("orderId", "flavorId", "editionId", quantity, state, "expiresAt")
      VALUES (NEW.id, flavor.id, edition->>'id', requested.quantity,
        CASE WHEN NEW."paymentStatus" IN ('paid', 'partially_refunded') THEN 'sold' ELSE 'reserved' END,
        now() + interval '40 minutes');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reserve_limited_flavors ON happycheese.orders;
CREATE TRIGGER reserve_limited_flavors AFTER INSERT OR UPDATE OF items, "paymentStatus", "pickupDate"
  ON happycheese.orders FOR EACH ROW EXECUTE FUNCTION happycheese.reserve_limited_flavors();

CREATE OR REPLACE FUNCTION happycheese.get_flavor_inventory(flavor_ids TEXT[])
RETURNS TABLE ("flavorId" TEXT, sold BIGINT, reserved BIGINT, remaining BIGINT)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = happycheese, pg_temp AS $$
  SELECT f.id,
    COALESCE(sum(r.quantity) FILTER (WHERE r.state = 'sold'), 0),
    COALESCE(sum(r.quantity) FILTER (WHERE r.state = 'reserved'), 0),
    CASE WHEN f."limitedEdition"->>'maxUnits' IS NULL THEN NULL ELSE greatest(0,
      (f."limitedEdition"->>'maxUnits')::bigint - COALESCE(sum(r.quantity) FILTER (WHERE r.state <> 'released'), 0)) END
  FROM happycheese.flavors f LEFT JOIN happycheese."flavorReservations" r
    ON r."flavorId" = f.id AND r."editionId" = f."limitedEdition"->>'id'
  WHERE f.id = ANY(flavor_ids) GROUP BY f.id;
$$;
REVOKE ALL ON FUNCTION happycheese.get_flavor_inventory(TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION happycheese.get_flavor_inventory(TEXT[]) TO service_role;
REVOKE ALL ON FUNCTION happycheese.prepare_limited_edition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION happycheese.reserve_limited_flavors() FROM PUBLIC, anon, authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
