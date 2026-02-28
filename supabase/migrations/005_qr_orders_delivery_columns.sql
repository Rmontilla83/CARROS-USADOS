-- Add missing delivery columns to qr_orders
ALTER TABLE qr_orders ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE qr_orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Make qr_url nullable (generated after vehicle activation, not at insert time)
ALTER TABLE qr_orders ALTER COLUMN qr_url DROP NOT NULL;
