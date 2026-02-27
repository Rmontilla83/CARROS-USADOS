# Plataforma de Venta de Vehículos Usados con QR + IA

## WHY
Marketplace venezolano de vehículos usados donde el carro físico ES el punto de venta. El vendedor paga $10, recibe un vinil QR que pega en su carro, y los compradores escanean para ver una tarjeta digital completa con fotos, video, precio y recomendaciones de IA.

## WHAT
- **Stack**: Next.js 15 (App Router) + TypeScript + Supabase (PostgreSQL + Auth + Storage) + Tailwind CSS
- **Pagos**: Stripe (USD) + integración futura Banco Mercantil (VES)
- **IA**: Anthropic Claude API para análisis de precios y recomendaciones
- **QR**: Generación dinámica con branding personalizado
- **Ads**: Meta Marketing API para publicidad automática
- **Hosting**: Vercel
- **Analytics**: PostHog

## Project Structure
```
src/
  app/              # Next.js App Router pages
    (public)/       # Páginas públicas (landing, catálogo, tarjeta vehículo)
    (auth)/         # Login, registro
    dashboard/      # Panel del vendedor
    admin/          # Panel de administración
  components/       # React components (functional + hooks only)
    ui/             # Componentes base reutilizables
    forms/          # Formularios
    layout/         # Header, Footer, Sidebar
  lib/              # Utilidades, configs, helpers
    supabase/       # Cliente Supabase, queries, types
    stripe/         # Configuración de pagos
    ai/             # Integración Claude API
    qr/             # Generación de QR codes
  types/            # TypeScript types e interfaces
  hooks/            # Custom React hooks
```

## HOW

### Commands
- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npx supabase db push` — Push migrations
- `npx supabase gen types typescript` — Generate DB types

### Code Style
- TypeScript estricto, NO usar `any`
- Functional components con hooks, NUNCA class components
- Tailwind CSS para estilos, NO CSS modules ni styled-components
- Nombres de archivos: kebab-case (ej: `vehicle-card.tsx`)
- Nombres de componentes: PascalCase (ej: `VehicleCard`)
- Server Components por defecto, "use client" solo cuando sea necesario
- Usar Zod para validación de formularios y API inputs
- Español para UI/contenido, inglés para código/variables/comentarios técnicos

### Testing
- Vitest para unit tests
- Playwright para E2E (fase 2)
- Todo endpoint de API necesita al menos un test

### Git Workflow
- Branch naming: `feature/nombre-corto`, `fix/descripcion`, `chore/tarea`
- Commits en inglés, descriptivos: `feat: add vehicle publication wizard`
- NUNCA commit directo a main, siempre PR

### Important Patterns
- Row Level Security (RLS) en TODAS las tablas de Supabase
- Manejo de errores con tipos Result pattern
- Loading states y error boundaries en toda la UI
- Imágenes optimizadas con next/image
- ISR para tarjetas de vehículos (revalidate: 3600)
- Server Actions para mutaciones de datos

### Venezuela-Specific
- Moneda dual: USD ($) y VES (Bs)
- Teléfonos formato: +58 (412) 123-4567
- Cédula: V-12345678 o E-12345678
- Ciudades principales de operación: Barcelona, Puerto La Cruz, Lechería (Anzoátegui)
