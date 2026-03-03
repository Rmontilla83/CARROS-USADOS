-- Search Alerts: users get notified when matching vehicles are published

-- Alert status enum
CREATE TYPE alert_status AS ENUM ('active', 'paused', 'expired');

-- Search alerts table
CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year_min INT,
  year_max INT,
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  transmission vehicle_transmission,
  fuel vehicle_fuel,
  city TEXT,
  status alert_status NOT NULL DEFAULT 'active',
  duration_days INT NOT NULL DEFAULT 30 CHECK (duration_days IN (30, 60, 90)),
  expires_at TIMESTAMPTZ NOT NULL,
  notification_count INT NOT NULL DEFAULT 0,
  last_notified_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert notifications table (dedup)
CREATE TABLE alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES search_alerts(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alert_id, vehicle_id)
);

-- Indexes
CREATE INDEX idx_search_alerts_user ON search_alerts(user_id);
CREATE INDEX idx_search_alerts_status ON search_alerts(status);
CREATE INDEX idx_search_alerts_expires ON search_alerts(expires_at);
CREATE INDEX idx_search_alerts_unsubscribe ON search_alerts(unsubscribe_token);
CREATE INDEX idx_alert_notifications_alert ON alert_notifications(alert_id);

-- RLS
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own alerts
CREATE POLICY "Users can view own alerts"
  ON search_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON search_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON search_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON search_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Admins full access to alerts
CREATE POLICY "Admins full access to alerts"
  ON search_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON alert_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM search_alerts WHERE id = alert_id AND user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_search_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_alerts_updated_at
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_alerts_updated_at();
