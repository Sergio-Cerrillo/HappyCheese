-- Restricciones de recogida por tienda
-- Ejecutar en Supabase SQL Editor del proyecto HappyCheese.

ALTER TABLE happycheese.stores
ADD COLUMN IF NOT EXISTS "pickupSettings" JSONB NOT NULL DEFAULT '{
  "minNoticeHours": 34,
  "maxAdvanceDays": 365,
  "pickupStart": "10:00",
  "pickupEnd": "20:00",
  "timeSlotIntervalMinutes": 30,
  "closedDates": []
}'::jsonb;

UPDATE happycheese.stores
SET "pickupSettings" = jsonb_build_object(
  'minNoticeHours', 34,
  'maxAdvanceDays', 365,
  'pickupStart', CASE
    WHEN lower(id) LIKE '%lux%' OR lower(name) LIKE '%lux%' THEN '11:00'
    ELSE '10:00'
  END,
  'pickupEnd', CASE
    WHEN lower(id) LIKE '%lux%' OR lower(name) LIKE '%lux%' THEN '21:00'
    ELSE '20:00'
  END,
  'timeSlotIntervalMinutes', 30,
  'closedDates', coalesce("pickupSettings"->'closedDates', '[]'::jsonb)
)
WHERE "pickupSettings" IS NULL
  OR NOT ("pickupSettings" ? 'pickupStart')
  OR NOT ("pickupSettings" ? 'pickupEnd')
  OR lower(id) LIKE '%lux%'
  OR lower(name) LIKE '%lux%';

COMMENT ON COLUMN happycheese.stores."pickupSettings" IS
'Reglas de recogida por tienda: antelacion minima, limite de dias, horario, intervalo y fechas cerradas YYYY-MM-DD.';

NOTIFY pgrst, 'reload schema';
