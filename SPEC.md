# SPEC.md — Plataforma Venta de Vehículos con QR + IA

## Vision
Un marketplace donde el carro físico en la calle actúa como vitrina móvil. El vendedor paga $10, recibe un vinil con QR, y cualquier persona que lo escanee accede a la tarjeta digital completa del vehículo.

## Core Features (MVP — Milestone 1)

### 1. Landing Page
- Hero con propuesta de valor clara
- Sección "Cómo funciona" (3 pasos: Publica → Recibe QR → Vende)
- CTA de registro prominente
- Carros destacados (grid responsive)
- Footer con info legal y contacto

### 2. Registro & Autenticación
- Registro con email + teléfono
- Login con email/password
- Verificación por email
- Campos obligatorios: nombre, cédula, ciudad, dirección, teléfono
- Supabase Auth con RLS

### 3. Publicación de Vehículo (Wizard)
- **Paso 1 — Datos**: marca, modelo, año, kilometraje, color, transmisión, combustible, placa
- **Paso 2 — Fotos**: mínimo 5 fotos (exterior frente, trasera, laterales, interior), max 15
- **Paso 3 — Video**: video opcional de recorrido (max 60s, subido a Supabase Storage)
- **Paso 4 — Precio**: precio en USD, IA muestra recomendación de mercado
- **Paso 5 — Descripción**: texto libre + checklist de condiciones (papeles al día, aire acondicionado, etc.)
- **Paso 6 — Pago**: $10 vía Stripe checkout
- **Paso 7 — Confirmación**: resumen + instrucciones de entrega del QR

### 4. Tarjeta Digital del Vehículo (QR destination)
- URL: `/{slug-vehiculo}` (SEO-friendly)
- Galería de fotos con lightbox/swipe
- Video embebido
- Especificaciones en formato limpio
- Precio con badge de recomendación IA ("Precio justo" / "Por encima del mercado" / "Oportunidad")
- Botón "Contactar al vendedor" (abre WhatsApp con mensaje pre-formateado)
- Formulario de feedback anónimo (¿te parece caro? ¿qué opinas?)
- Metadata OpenGraph para compartir en redes sociales
- Diseño mobile-first (la mayoría escaneará desde el teléfono)

### 5. Generación de QR
- QR code dinámico que apunta a la tarjeta del vehículo
- Diseño de vinil: logo de la plataforma + "SE VENDE" + QR grande + URL corta
- Generado como PNG/PDF descargable para el aliado de impresión
- Tamaño: optimizado para verse desde 3-5 metros de distancia

### 6. Dashboard del Vendedor
- Lista de mis vehículos (activos, vencidos, vendidos)
- Analytics básico por vehículo: visitas totales, escaneos QR
- Estado del QR (pendiente impresión → impreso → entregado)
- Botón para marcar como "Vendido"
- Historial de pagos

### 7. Panel Admin (básico)
- Dashboard con métricas: publicaciones activas, ingresos, usuarios
- Cola de impresión de QR (tabla con status)
- Lista de usuarios
- Moderación de publicaciones (aprobar/rechazar)

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (fotos y videos)
- **Payments**: Stripe Checkout
- **QR**: `qrcode` npm package + Canvas API para branding
- **AI**: Anthropic Claude API (recomendaciones de precio)
- **Validation**: Zod
- **Forms**: React Hook Form + Zod resolver
- **Hosting**: Vercel
- **Analytics**: PostHog (auto-hosted o cloud)

## Design Guidelines
- **Mobile-first**: toda la UI prioriza móvil (los compradores escanean con teléfono)
- **Colores**: azul profundo (#1B4F72) como primario, blanco limpio, acentos en verde (#27AE60) para CTAs
- **Tipografía**: Inter para UI, system fonts como fallback
- **Componentes**: shadcn/ui como base, customizados con los colores de marca
- **Fotos**: aspect ratio 4:3 para vehículos, lazy loading, blur placeholder
- **Performance**: Core Web Vitals como prioridad (LCP < 2.5s)

## Milestones

### Milestone 1 — MVP Funcional (Semana 1-2)
- Landing page
- Auth (registro + login)
- Wizard de publicación (sin pago real, modo test)
- Tarjeta digital del vehículo
- Generación de QR
- Dashboard vendedor básico
- Admin básico
- Deploy en Vercel

### Milestone 2 — Pagos + IA (Semana 3-4)
- Stripe checkout real
- Integración Claude API para recomendaciones de precio
- Analytics de visitas por vehículo
- Feedback anónimo de compradores
- Sistema de expiración (2 meses)
- Notificaciones por email (confirmación, recordatorios)
- Meta Ads automáticos (API)

### Milestone 3 — Logística + Escala (Semana 5-8)
- Panel de aliados de impresión
- Sistema de asignación de motorizados
- Tracking de entrega
- App móvil (React Native)
- Chat comprador-vendedor
- Pasarela en bolívares (Banco Mercantil)
- Catálogo público con filtros avanzados

## Database Schema (Supabase)

```sql
-- Core tables for MVP
-- See /supabase/migrations/ for full schema

-- users: extends Supabase auth.users
-- vehicles: publicaciones de vehículos
-- media: fotos y videos por vehículo
-- qr_orders: órdenes de impresión de QR
-- payments: registro de pagos
-- feedback: opiniones anónimas de visitantes
-- analytics_events: tracking de visitas y escaneos
-- ai_price_reports: reportes de IA sobre pricing
```

## Environment Variables Needed
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Anthropic (IA)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```
