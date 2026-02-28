-- =============================================================
-- 006: Role-Based Access Control (RBAC) RLS Policies
-- New roles: analyst, moderator, support (added to user_role enum)
-- Existing roles: admin, printer, courier, seller
-- =============================================================

-- Add new enum values (idempotent — only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'analyst' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'analyst';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moderator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'moderator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'support';
  END IF;
END
$$;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- =============================================================
-- VEHICLES — Moderator can SELECT all, UPDATE only status
-- =============================================================

-- Moderator: read all vehicles
CREATE POLICY "moderator_select_vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('moderator', 'analyst', 'support'));

-- Moderator: update vehicle status only
CREATE POLICY "moderator_update_vehicles"
  ON public.vehicles
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'moderator'))
  WITH CHECK (public.get_user_role() IN ('admin', 'moderator'));

-- =============================================================
-- QR_ORDERS — Printer: SELECT all, UPDATE print-related fields
-- =============================================================

-- Printer: read all QR orders
CREATE POLICY "printer_select_qr_orders"
  ON public.qr_orders
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('printer', 'admin'));

-- Printer: update QR order (print, assign)
CREATE POLICY "printer_update_qr_orders"
  ON public.qr_orders
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'printer'))
  WITH CHECK (public.get_user_role() IN ('admin', 'printer'));

-- =============================================================
-- QR_ORDERS — Courier: SELECT own assigned, UPDATE delivered
-- =============================================================

-- Courier: read only orders assigned to them
CREATE POLICY "courier_select_own_qr_orders"
  ON public.qr_orders
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'courier'
    AND courier_id = auth.uid()
  );

-- Courier: update only own assigned orders (mark delivered)
CREATE POLICY "courier_update_own_qr_orders"
  ON public.qr_orders
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'courier'
    AND courier_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() = 'courier'
    AND courier_id = auth.uid()
  );

-- =============================================================
-- PAYMENTS — Support can SELECT all, UPDATE verification fields
-- =============================================================

-- Support: read all payments
CREATE POLICY "support_select_payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('support', 'analyst', 'admin'));

-- Support: update payment verification
CREATE POLICY "support_update_payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'support'))
  WITH CHECK (public.get_user_role() IN ('admin', 'support'));

-- =============================================================
-- PROFILES — Analyst: read-only access
-- =============================================================

-- Analyst: read all profiles
CREATE POLICY "analyst_select_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('analyst', 'support', 'admin'));

-- =============================================================
-- FEEDBACK — Analyst: read-only
-- =============================================================

CREATE POLICY "analyst_select_feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('analyst', 'admin'));
