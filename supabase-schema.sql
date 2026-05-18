-- Create happycheese schema
CREATE SCHEMA IF NOT EXISTS happycheese;

-- Stores table
CREATE TABLE IF NOT EXISTS happycheese.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Flavors table
CREATE TABLE IF NOT EXISTS happycheese.flavors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prices JSONB NOT NULL,
  image TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  availability JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS happycheese.orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  "storeId" TEXT NOT NULL,
  "storeName" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  notes TEXT,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  "pickupDate" TEXT NOT NULL,
  "pickupTime" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS happycheese.admins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS happycheese.sessions (
  id TEXT PRIMARY KEY,
  "adminId" TEXT NOT NULL REFERENCES happycheese.admins(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_active ON happycheese.stores(active);
CREATE INDEX IF NOT EXISTS idx_flavors_active ON happycheese.flavors(active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON happycheese.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON happycheese.orders("createdAt");
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON happycheese.sessions("adminId");
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON happycheese.sessions("expiresAt");

-- Enable Row Level Security (RLS)
ALTER TABLE happycheese.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE happycheese.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
-- Stores: permitir lectura pública de tiendas activas
CREATE POLICY "Allow public read stores" 
  ON happycheese.stores 
  FOR SELECT 
  USING (happycheese.stores.active = true);

-- Flavors: permitir lectura pública de sabores activos
CREATE POLICY "Allow public read flavors" 
  ON happycheese.flavors 
  FOR SELECT 
  USING (happycheese.flavors.active = true);

-- Orders: permitir inserción pública (para crear pedidos)
CREATE POLICY "Allow insert orders" 
  ON happycheese.orders 
  FOR INSERT 
  WITH CHECK (true);

-- Orders: permitir lectura pública (ajustar según necesites)
CREATE POLICY "Allow read orders" 
  ON happycheese.orders 
  FOR SELECT 
  USING (true);

-- Admins: solo lectura para autenticación (no exposición pública)
CREATE POLICY "Allow read admins for auth" 
  ON happycheese.admins 
  FOR SELECT 
  USING (true);

-- Sessions: permitir todas las operaciones (ajustar según tu lógica de autenticación)
CREATE POLICY "Allow all sessions" 
  ON happycheese.sessions 
  FOR ALL 
  USING (true);
