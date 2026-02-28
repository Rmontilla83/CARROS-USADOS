-- Migration: 004_payment_gateway.sql
-- Payment Gateway: Stripe + Mercantil infrastructure

-- ============================================
-- EXTEND PAYMENT METHOD ENUM
-- ============================================

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mercantil_c2p';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mercantil_debit';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mercantil_card';

-- ============================================
-- EXTEND PAYMENTS TABLE
-- ============================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_image_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bcv_rate DECIMAL(12,4);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_ves DECIMAL(16,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mercantil_transaction_id TEXT;

-- ============================================
-- BCV RATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bcv_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate DECIMAL(12,4) NOT NULL,
  source TEXT NOT NULL DEFAULT 'pydolarve',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcv_rates_fetched_at ON bcv_rates(fetched_at DESC);

-- RLS for bcv_rates
ALTER TABLE bcv_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BCV rates are viewable by everyone" ON bcv_rates FOR SELECT USING (true);

CREATE POLICY "Admins have full access to bcv_rates" ON bcv_rates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Index on payments for new columns
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
