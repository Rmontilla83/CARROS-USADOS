export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CarrosUsados";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Publication pricing
export const PUBLICATION_PRICE_USD = 20;
export const BCV_RATE_FALLBACK = 80.0;

// Payment methods configuration
export const PAYMENT_METHODS = {
  stripe: { id: "stripe" as const, label: "Tarjeta Internacional", enabled: true },
  mercantil_card: { id: "mercantil_card" as const, label: "Tarjeta Nacional", enabled: true },
  mercantil_c2p: { id: "mercantil_c2p" as const, label: "Pago Móvil (C2P)", enabled: true },
  mercantil_debit: { id: "mercantil_debit" as const, label: "Débito Inmediato", enabled: false },
} as const;

// Vehicle constraints
export const MIN_PHOTOS = 5;
export const MAX_PHOTOS = 15;
export const MAX_VIDEO_DURATION_SECONDS = 60;
export const MIN_YEAR = 1970;
export const MAX_YEAR = new Date().getFullYear() + 1;

// Venezuela-specific
export const STATES = [
  "Anzoátegui",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Caracas (Distrito Capital)",
  "Cojedes",
  "Delta Amacuro",
  "Falcón",
  "Guárico",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Vargas",
  "Yaracuy",
  "Zulia",
] as const;

export const MAIN_CITIES = [
  "Barcelona",
  "Puerto La Cruz",
  "Lechería",
] as const;

// Common vehicle brands in Venezuela
export const VEHICLE_BRANDS = [
  "Toyota",
  "Chevrolet",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Honda",
  "Mitsubishi",
  "Mazda",
  "Volkswagen",
  "Jeep",
  "Dodge",
  "Fiat",
  "Renault",
  "Chery",
  "Suzuki",
  "Subaru",
  "BMW",
  "Mercedes-Benz",
  "Otro",
] as const;

// Search alerts
export const MAX_ACTIVE_ALERTS = 5;
export const ALERT_DURATION_OPTIONS = [
  { value: 30, label: "30 días" },
  { value: 60, label: "60 días" },
  { value: 90, label: "90 días" },
] as const;

// Vehicle conditions checklist
export const VEHICLE_CONDITIONS = [
  { key: "papers_ok", label: "Papeles al día" },
  { key: "ac", label: "Aire acondicionado funcional" },
  { key: "original_paint", label: "Pintura original" },
  { key: "no_accidents", label: "Sin accidentes" },
  { key: "single_owner", label: "Único dueño" },
  { key: "service_history", label: "Historial de mantenimiento" },
  { key: "spare_tire", label: "Caucho de repuesto" },
  { key: "alarm", label: "Alarma" },
  { key: "power_windows", label: "Vidrios eléctricos" },
  { key: "power_steering", label: "Dirección hidráulica" },
  { key: "abs", label: "Frenos ABS" },
  { key: "airbags", label: "Airbags" },
] as const;
