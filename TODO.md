# TODO.md — Milestone 1: MVP Funcional

## Pre-setup (hacer ANTES de abrir Claude Code)
- [ ] Crear cuenta en Supabase (https://supabase.com) y nuevo proyecto
- [ ] Copiar SUPABASE_URL y SUPABASE_ANON_KEY
- [ ] Crear cuenta en Stripe (https://stripe.com) y obtener test keys
- [ ] Tener API key de Anthropic lista (https://console.anthropic.com)
- [ ] Tener cuenta de Vercel conectada a GitHub

## Fase A — Setup del Proyecto
- [ ] `npx create-next-app@latest nombre-app --typescript --tailwind --app --src-dir`
- [ ] Instalar dependencias core: `npm i @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers`
- [ ] Instalar shadcn/ui: `npx shadcn@latest init`
- [ ] Configurar Supabase client (lib/supabase/client.ts + server.ts + middleware.ts)
- [ ] Configurar variables de entorno (.env.local)
- [ ] Copiar CLAUDE.md y SPEC.md al root del proyecto
- [ ] `git init` + primer commit + push a GitHub
- [ ] Conectar repo a Vercel

## Fase B — Base de Datos
- [ ] Crear migration inicial con todas las tablas del MVP
- [ ] Configurar RLS policies para cada tabla
- [ ] Crear bucket de Storage para fotos y videos
- [ ] Generar types de TypeScript desde Supabase
- [ ] Seed data: 3-5 vehículos de ejemplo

## Fase C — Autenticación
- [ ] Página de registro (/register) con formulario completo
- [ ] Página de login (/login)
- [ ] Middleware de protección de rutas
- [ ] Layout autenticado vs público
- [ ] Flujo de verificación por email

## Fase D — Publicación de Vehículo
- [ ] Wizard multi-step con estado persistente
- [ ] Step 1: Formulario de datos del vehículo (con validación Zod)
- [ ] Step 2: Upload de fotos (drag & drop, preview, reorder)
- [ ] Step 3: Upload de video (opcional)
- [ ] Step 4: Precio + placeholder para recomendación IA
- [ ] Step 5: Descripción + checklist de condiciones
- [ ] Step 6: Resumen + botón de confirmar (pago en milestone 2)
- [ ] Server Action para guardar vehículo en DB
- [ ] Upload de media a Supabase Storage

## Fase E — Tarjeta Digital del Vehículo
- [ ] Página dinámica /[slug] con Server Component
- [ ] Galería de fotos con swipe/lightbox
- [ ] Video player embebido
- [ ] Sección de especificaciones
- [ ] Precio con badge placeholder de IA
- [ ] Botón de WhatsApp con mensaje pre-formateado
- [ ] Formulario de feedback anónimo
- [ ] OpenGraph metadata para compartir
- [ ] Diseño 100% mobile-first

## Fase F — Generación de QR
- [ ] Librería de generación de QR (qrcode)
- [ ] Template del vinil con branding (Canvas API)
- [ ] Descarga como PNG de alta resolución
- [ ] Preview del vinil en el dashboard

## Fase G — Dashboard del Vendedor
- [ ] Layout con sidebar/nav
- [ ] Lista de mis vehículos con status
- [ ] Vista de detalle con analytics básico
- [ ] Acción: marcar como vendido
- [ ] Historial de pagos (placeholder)

## Fase H — Panel Admin
- [ ] Ruta protegida /admin (role-based)
- [ ] Dashboard con contadores
- [ ] Tabla de publicaciones con moderación
- [ ] Cola de impresión de QR
- [ ] Lista de usuarios

## Fase I — Polish & Deploy
- [ ] Responsive testing en móvil real
- [ ] Loading states en todas las páginas
- [ ] Error boundaries
- [ ] 404 y error pages
- [ ] Favicon y metadata
- [ ] Performance audit (Lighthouse)
- [ ] Deploy final a Vercel
- [ ] Dominio temporal mientras se decide nombre
