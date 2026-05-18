-- Este script DESACTIVA temporalmente RLS para debug
-- Úsalo SOLO en desarrollo para diagnosticar problemas
-- NO usar en producción

-- Opción 1: Desactivar RLS completamente (temporal)
ALTER TABLE happycheese.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.flavors DISABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.sessions DISABLE ROW LEVEL SECURITY;

-- Opción 2: Si prefieres mantener RLS pero con políticas permisivas (SOLO DESARROLLO)
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow public read stores" ON happycheese.stores;
DROP POLICY IF EXISTS "Allow public read flavors" ON happycheese.flavors;
DROP POLICY IF EXISTS "Allow insert orders" ON happycheese.orders;
DROP POLICY IF EXISTS "Allow read orders" ON happycheese.orders;
DROP POLICY IF EXISTS "Allow read admins for auth" ON happycheese.admins;
DROP POLICY IF EXISTS "Allow all sessions" ON happycheese.sessions;

-- Crear políticas permisivas para DESARROLLO
CREATE POLICY "Allow all on stores" ON happycheese.stores FOR ALL USING (true);
CREATE POLICY "Allow all on flavors" ON happycheese.flavors FOR ALL USING (true);
CREATE POLICY "Allow all on orders" ON happycheese.orders FOR ALL USING (true);
CREATE POLICY "Allow all on admins" ON happycheese.admins FOR ALL USING (true);
CREATE POLICY "Allow all on sessions" ON happycheese.sessions FOR ALL USING (true);
