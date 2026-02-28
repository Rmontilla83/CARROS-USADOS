// Database types - will be auto-generated from Supabase later
// For now, manually defining based on 001_initial_schema.sql

export type VehicleStatus = "draft" | "pending_review" | "active" | "expired" | "sold" | "rejected";
export type VehicleTransmission = "automatic" | "manual" | "cvt";
export type VehicleFuel = "gasoline" | "diesel" | "electric" | "hybrid" | "gas";
export type QrOrderStatus = "pending" | "printing" | "printed" | "assigned" | "delivered";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentCurrency = "USD" | "VES";
export type PaymentMethod = "stripe" | "bank_transfer" | "pago_movil" | "zelle" | "mercantil_c2p" | "mercantil_debit" | "mercantil_card";
export type MediaType = "photo" | "video";
export type UserRole = "seller" | "admin" | "printer" | "courier";
export type PriceOpinion = "fair" | "too_expensive" | "good_deal" | "no_opinion";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  cedula: string | null;
  phone: string | null;
  city: string | null;
  state: string;
  address: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  plate: string | null;
  mileage: number | null;
  transmission: VehicleTransmission;
  fuel: VehicleFuel;
  engine: string | null;
  doors: number;
  price: number;
  suggested_price: number | null;
  description: string | null;
  conditions: Record<string, boolean>;
  slug: string;
  status: VehicleStatus;
  published_at: string | null;
  expires_at: string | null;
  sold_at: string | null;
  views_count: number;
  qr_scans_count: number;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  vehicle_id: string;
  type: MediaType;
  url: string;
  storage_path: string;
  display_order: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

export interface QrOrder {
  id: string;
  vehicle_id: string;
  qr_url: string;
  qr_image_url: string | null;
  vinyl_pdf_url: string | null;
  printer_id: string | null;
  courier_id: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_phone: string | null;
  preferred_time: string | null;
  delivery_notes: string | null;
  status: QrOrderStatus;
  printed_at: string | null;
  assigned_at: string | null;
  delivered_at: string | null;
  delivery_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  gateway_reference: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  description: string | null;
  proof_image_url: string | null;
  reference_number: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  bcv_rate: number | null;
  amount_ves: number | null;
  mercantil_transaction_id: string | null;
  created_at: string;
}

export interface BcvRate {
  id: string;
  rate: number;
  source: string;
  fetched_at: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  vehicle_id: string;
  price_opinion: PriceOpinion;
  comment: string | null;
  rating: number | null;
  visitor_fingerprint: string | null;
  source: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  vehicle_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  session_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface AiPriceReport {
  id: string;
  vehicle_id: string;
  market_price_low: number | null;
  market_price_high: number | null;
  suggested_price: number | null;
  confidence: number | null;
  analysis: string | null;
  data_sources: unknown[];
  generated_at: string;
}
