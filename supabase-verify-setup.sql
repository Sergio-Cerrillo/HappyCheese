-- Este script verifica y configura permisos en el schema happycheese
-- Ejecuta esto en Supabase SQL Editor

-- 1. Verificar que el schema existe
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'happycheese';

-- 2. Dar permisos al rol anon (usado por el cliente de Supabase)
GRANT USAGE ON SCHEMA happycheese TO anon;
GRANT USAGE ON SCHEMA happycheese TO authenticated;

-- 3. Dar permisos sobre todas las tablas
GRANT ALL ON ALL TABLES IN SCHEMA happycheese TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA happycheese TO authenticated;

-- 4. Dar permisos sobre secuencias (para IDs auto-generados)
GRANT ALL ON ALL SEQUENCES IN SCHEMA happycheese TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA happycheese TO authenticated;

-- 5. Verificar las tablas existentes
SELECT table_name FROM information_schema.tables WHERE table_schema = 'happycheese';

-- 6. Verificar los datos en las tablas
SELECT 'stores' as table_name, COUNT(*) as count FROM happycheese.stores
UNION ALL
SELECT 'flavors', COUNT(*) FROM happycheese.flavors
UNION ALL
SELECT 'orders', COUNT(*) FROM happycheese.orders
UNION ALL
SELECT 'admins', COUNT(*) FROM happycheese.admins
UNION ALL
SELECT 'sessions', COUNT(*) FROM happycheese.sessions;
