-- Ejecutar antes de desplegar el nuevo webhook. No modifica pedidos históricos.
ALTER TABLE happycheese.orders
ADD COLUMN IF NOT EXISTS "customerConfirmationSentAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "storeNotificationSentAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "refundedAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN happycheese.orders."paymentStatus" IS
'Estados: pending, paid, failed, expired, refunded, partially_refunded';
