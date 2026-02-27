-- Migration: 001_initial_schema.sql
-- Plataforma de Venta de Vehículos con QR + IA

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE vehicle_status AS ENUM ('draft', 'pending_review', 'active', 'expired', 'sold', 'rejected');
CREATE TYPE vehicle_transmission AS ENUM ('automatic', 'manual', 'cvt');
CREATE TYPE vehicle_fuel AS ENUM ('gasoline', 'diesel', 'electric', 'hybrid', 'gas');
CREATE TYPE qr_order_status AS ENUM ('pending', 'printing', 'printed', 'assigned', 'delivered');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_currency AS ENUM ('USD', 'VES');
CREATE TYPE payment_method AS ENUM ('stripe', 'bank_transfer', 'pago_movil', 'zelle');
CREATE TYPE media_type AS ENUM ('photo', 'video');
CREATE TYPE user_role AS ENUM ('seller', 'admin', 'printer', 'courier');
CREATE TYPE price_opinion AS ENUM ('fair', 'too_expensive', 'good_deal', 'no_opinion');

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cedula TEXT, -- V-12345678 or E-12345678
  phone TEXT, -- +58 format
  city TEXT,
  state TEXT DEFAULT 'Anzoátegui',
  address TEXT,
  role user_role DEFAULT 'seller',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VEHICLES
-- ============================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Vehicle info
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1970 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  color TEXT,
  plate TEXT,
  mileage INTEGER, -- km
  transmission vehicle_transmission DEFAULT 'manual',
  fuel vehicle_fuel DEFAULT 'gasoline',
  engine TEXT, -- e.g. "2.0L 4cil"
  doors INTEGER DEFAULT 4 CHECK (doors >= 2 AND doors <= 6),
  
  -- Listing info
  price DECIMAL(12,2) NOT NULL, -- in USD
  suggested_price DECIMAL(12,2), -- IA suggested price
  description TEXT,
  
  -- Conditions checklist (JSONB for flexibility)
  conditions JSONB DEFAULT '{}',
  -- Example: {"papers_ok": true, "ac": true, "original_paint": false, ...}
  
  -- SEO
  slug TEXT UNIQUE NOT NULL,
  
  -- Status
  status vehicle_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  
  -- Metadata
  views_count INTEGER DEFAULT 0,
  qr_scans_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_slug ON vehicles(slug);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_city ON vehicles(user_id); -- will join with profiles

-- ============================================
-- MEDIA (photos & videos)
-- ============================================

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_vehicle_id ON media(vehicle_id);

-- ============================================
-- QR ORDERS
-- ============================================

CREATE TABLE qr_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- QR data
  qr_url TEXT NOT NULL, -- URL the QR points to
  qr_image_url TEXT, -- generated QR image
  vinyl_pdf_url TEXT, -- printable vinyl design
  
  -- Logistics
  printer_id UUID REFERENCES profiles(id),
  courier_id UUID REFERENCES profiles(id),
  
  -- Delivery info
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_phone TEXT,
  
  -- Status tracking
  status qr_order_status DEFAULT 'pending',
  printed_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_photo_url TEXT, -- proof of delivery
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_orders_status ON qr_orders(status);
CREATE INDEX idx_qr_orders_vehicle_id ON qr_orders(vehicle_id);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  
  amount DECIMAL(12,2) NOT NULL,
  currency payment_currency DEFAULT 'USD',
  method payment_method DEFAULT 'stripe',
  
  -- Gateway references
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  gateway_reference TEXT, -- for non-Stripe payments
  
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Invoice
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_vehicle_id ON payments(vehicle_id);

-- ============================================
-- FEEDBACK (anonymous from visitors)
-- ============================================

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  price_opinion price_opinion DEFAULT 'no_opinion',
  comment TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Anonymous tracking
  visitor_fingerprint TEXT, -- hashed, for dedup
  source TEXT DEFAULT 'qr', -- 'qr', 'web', 'social'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_vehicle_id ON feedback(vehicle_id);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'view', 'qr_scan', 'whatsapp_click', 'feedback_submit', 'share'
  metadata JSONB DEFAULT '{}',
  
  -- Session info
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- hashed for privacy
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_vehicle_id ON analytics_events(vehicle_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- ============================================
-- AI PRICE REPORTS
-- ============================================

CREATE TABLE ai_price_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  market_price_low DECIMAL(12,2),
  market_price_high DECIMAL(12,2),
  suggested_price DECIMAL(12,2),
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  
  analysis TEXT, -- AI-generated explanation
  data_sources JSONB DEFAULT '[]', -- where the AI got pricing data
  
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_reports_vehicle_id ON ai_price_reports(vehicle_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_price_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicles: public can read active, owners can CRUD own
CREATE POLICY "Active vehicles are viewable by everyone" ON vehicles FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- Media: public can read, owners can CRUD
CREATE POLICY "Media is viewable by everyone" ON media FOR SELECT USING (true);
CREATE POLICY "Users can manage own vehicle media" ON media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = media.vehicle_id AND vehicles.user_id = auth.uid())
);
CREATE POLICY "Users can update own vehicle media" ON media FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = media.vehicle_id AND vehicles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own vehicle media" ON media FOR DELETE USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = media.vehicle_id AND vehicles.user_id = auth.uid())
);

-- QR Orders: owners can read own
CREATE POLICY "Users can view own QR orders" ON qr_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = qr_orders.vehicle_id AND vehicles.user_id = auth.uid())
);

-- Payments: users can read own
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Feedback: anyone can insert, vehicle owners can read
CREATE POLICY "Anyone can submit feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Vehicle owners can view feedback" ON feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = feedback.vehicle_id AND vehicles.user_id = auth.uid())
);

-- Analytics: anyone can insert, vehicle owners can read
CREATE POLICY "Anyone can log events" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Vehicle owners can view analytics" ON analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = analytics_events.vehicle_id AND vehicles.user_id = auth.uid())
);

-- AI Reports: vehicle owners can read
CREATE POLICY "Vehicle owners can view AI reports" ON ai_price_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = ai_price_reports.vehicle_id AND vehicles.user_id = auth.uid())
);

-- ============================================
-- ADMIN POLICIES (role-based)
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins have full access to vehicles" ON vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to qr_orders" ON qr_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to feedback" ON feedback FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to analytics" ON analytics_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to ai_reports" ON ai_price_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Printers can view/update assigned QR orders
CREATE POLICY "Printers can view assigned orders" ON qr_orders FOR SELECT USING (printer_id = auth.uid());
CREATE POLICY "Printers can update assigned orders" ON qr_orders FOR UPDATE USING (printer_id = auth.uid());

-- Couriers can view/update assigned deliveries
CREATE POLICY "Couriers can view assigned deliveries" ON qr_orders FOR SELECT USING (courier_id = auth.uid());
CREATE POLICY "Couriers can update assigned deliveries" ON qr_orders FOR UPDATE USING (courier_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_qr_orders_updated_at BEFORE UPDATE ON qr_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment view count (called via RPC)
CREATE OR REPLACE FUNCTION increment_vehicle_views(vehicle_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE vehicles SET views_count = views_count + 1 WHERE id = vehicle_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment QR scan count
CREATE OR REPLACE FUNCTION increment_qr_scans(vehicle_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE vehicles SET qr_scans_count = qr_scans_count + 1 WHERE id = vehicle_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate slug from brand + model + year
CREATE OR REPLACE FUNCTION generate_vehicle_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(
    REGEXP_REPLACE(
      CONCAT(NEW.brand, '-', NEW.model, '-', NEW.year),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  );
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;
  
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM vehicles WHERE slug = final_slug AND id != NEW.id);
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_slug_before_insert
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_vehicle_slug();

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================
-- CREATE POLICY on storage.objects for bucket 'vehicles'
-- Public read, authenticated write for own vehicles
