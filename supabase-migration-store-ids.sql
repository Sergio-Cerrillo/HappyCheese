-- Migration: Update store IDs from santa-catalina/centro-historico to happycheese/happycheese-lux
-- Fecha: 16 marzo 2026

-- 1. Actualizar las tiendas
UPDATE happycheese.stores 
SET 
  id = 'happycheese',
  name = 'HappyCheese',
  "updatedAt" = NOW()
WHERE id = 'santa-catalina';

UPDATE happycheese.stores 
SET 
  id = 'happycheese-lux',
  name = 'HappyCheese LUX',
  "updatedAt" = NOW()
WHERE id = 'centro-historico';

-- 2. Actualizar availability en flavors (reemplazar IDs en JSON)
UPDATE happycheese.flavors
SET 
  availability = REPLACE(availability::text, 'santa-catalina', 'happycheese')::jsonb,
  "updatedAt" = NOW()
WHERE availability::text LIKE '%santa-catalina%';

UPDATE happycheese.flavors
SET 
  availability = REPLACE(availability::text, 'centro-historico', 'happycheese-lux')::jsonb,
  "updatedAt" = NOW()
WHERE availability::text LIKE '%centro-historico%';

-- 3. Actualizar storeId en orders existentes
UPDATE happycheese.orders
SET 
  "storeId" = 'happycheese',
  "storeName" = 'HappyCheese',
  "updatedAt" = NOW()
WHERE "storeId" = 'santa-catalina';

UPDATE happycheese.orders
SET 
  "storeId" = 'happycheese-lux',
  "storeName" = 'HappyCheese LUX',
  "updatedAt" = NOW()
WHERE "storeId" = 'centro-historico';

-- Verificar cambios
SELECT id, name FROM happycheese.stores;
SELECT id, name, availability FROM happycheese.flavors LIMIT 5;
