-- Add optimized thumbnail URL support for flavor images.
ALTER TABLE happycheese.flavors
ADD COLUMN IF NOT EXISTS "imageThumb" TEXT;

-- Existing rows keep using image as fallback until they are regenerated/migrated.
