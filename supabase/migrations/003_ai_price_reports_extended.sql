-- Add new fields to ai_price_reports for enhanced AI price analysis
-- These fields support min/max price limits, market factors, and detailed arguments

ALTER TABLE ai_price_reports
  ADD COLUMN IF NOT EXISTS price_market_avg DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS factors_up JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS factors_down JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS argument_min TEXT,
  ADD COLUMN IF NOT EXISTS argument_max TEXT,
  ADD COLUMN IF NOT EXISTS argument_suggested TEXT,
  ADD COLUMN IF NOT EXISTS market_summary TEXT;

-- market_price_low now represents price_min (minimum allowed price)
-- market_price_high now represents price_max (maximum allowed price)
-- These columns already exist, just documenting the semantic change

COMMENT ON COLUMN ai_price_reports.market_price_low IS 'Minimum allowed price (price floor)';
COMMENT ON COLUMN ai_price_reports.market_price_high IS 'Maximum allowed price (price ceiling)';
COMMENT ON COLUMN ai_price_reports.price_market_avg IS 'Market average price for this vehicle';
COMMENT ON COLUMN ai_price_reports.factors_up IS 'JSON array of factors that increase price';
COMMENT ON COLUMN ai_price_reports.factors_down IS 'JSON array of factors that decrease price';
COMMENT ON COLUMN ai_price_reports.argument_min IS 'Explanation of why this is the minimum price';
COMMENT ON COLUMN ai_price_reports.argument_max IS 'Explanation of why this is the maximum price';
COMMENT ON COLUMN ai_price_reports.argument_suggested IS 'Explanation of why the suggested price is optimal';
COMMENT ON COLUMN ai_price_reports.market_summary IS 'Executive summary of market conditions for this vehicle';
