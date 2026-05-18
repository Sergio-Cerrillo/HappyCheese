-- Añadir campos de pago a la tabla orders
ALTER TABLE happycheese.orders 
ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session 
ON happycheese.orders("stripeSessionId");

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON happycheese.orders("paymentStatus");

-- Comentarios
COMMENT ON COLUMN happycheese.orders."paymentStatus" IS 
'Estados: pending, paid, failed, refunded';
