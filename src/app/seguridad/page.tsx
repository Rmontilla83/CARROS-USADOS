import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  FileSearch,
  Banknote,
  MapPin,
  Users,
  Search,
  Lock,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Seguridad — Recomendaciones para Compradores y Vendedores",
  description: `Recomendaciones de seguridad para comprar y vender vehículos de forma segura en ${APP_NAME}.`,
};

export default function SeguridadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-xl bg-accent/10 p-3">
              <ShieldCheck className="size-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Recomendaciones de Seguridad
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu seguridad es lo primero. Lee antes de comprar o vender.
              </p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {APP_NAME} NO interviene en la transacción
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Somos una plataforma de publicación. No verificamos los vehículos
                  ni a los vendedores. Toma precauciones en cada paso del proceso.
                </p>
              </div>
            </div>
          </div>

          {/* Buyer recommendations */}
          <h2 className="text-xl font-bold text-foreground mb-4">
            Para Compradores
          </h2>

          <div className="space-y-4 mb-10">
            {[
              {
                icon: FileSearch,
                title: "Verifica documentos originales en persona",
                description:
                  "Antes de cualquier compromiso, revisa el certificado de origen, título de propiedad, cédula del dueño y factura de compra. Nunca aceptes fotocopias como garantía.",
                color: "text-primary bg-primary/10",
              },
              {
                icon: Banknote,
                title: "No hagas pagos anticipados sin ver el carro",
                description:
                  "Nunca transfieras dinero, hagas depósitos o des señas antes de ver el vehículo en persona y verificar su estado. Un vendedor legítimo no te presionará a pagar sin ver el carro.",
                color: "text-red-600 bg-red-100",
              },
              {
                icon: MapPin,
                title: "Reúnete en lugares públicos y seguros",
                description:
                  "Acuerda ver el vehículo en lugares con mucha gente: centros comerciales, estaciones de servicio, o estacionamientos públicos. Evita zonas apartadas o desconocidas.",
                color: "text-accent bg-accent/10",
              },
              {
                icon: Users,
                title: "Lleva un acompañante a la cita",
                description:
                  "Siempre ve acompañado de una persona de confianza. Informa a familiares o amigos a dónde vas, con quién y a qué hora.",
                color: "text-blue-600 bg-blue-100",
              },
              {
                icon: Search,
                title: "Verifica la placa en el CICPC/SIPOL",
                description:
                  "Antes de comprar, verifica que el vehículo no tenga denuncias de robo o restricciones legales. Puedes consultar en las oficinas del CICPC o el sistema SIPOL.",
                color: "text-purple-600 bg-purple-100",
              },
              {
                icon: Lock,
                title: "No compartas datos bancarios por chat",
                description:
                  "Nunca envíes fotos de tus tarjetas, claves bancarias o datos sensibles por WhatsApp, chat o cualquier medio digital. Un vendedor legítimo no necesita esa información.",
                color: "text-orange-600 bg-orange-100",
              },
              {
                icon: Phone,
                title: "Desconfía de precios demasiado buenos",
                description:
                  "Si el precio está muy por debajo del mercado, investiga más. Puede ser una señal de que algo no está bien con el vehículo o con la transacción.",
                color: "text-amber-600 bg-amber-100",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border bg-white p-5"
              >
                <div className={`shrink-0 rounded-xl p-3 ${item.color}`}>
                  <item.icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Seller recommendations */}
          <h2 className="text-xl font-bold text-foreground mb-4">
            Para Vendedores
          </h2>

          <div className="space-y-4 mb-10">
            {[
              {
                title: "Publica información veraz",
                description:
                  "Describe el estado real de tu vehículo con honestidad. Los compradores aprecian la transparencia y evitarás problemas futuros.",
              },
              {
                title: "Reúnete en lugares seguros",
                description:
                  "Al igual que los compradores, acuerda citas en lugares públicos y concurridos. Nunca lleves a desconocidos a tu casa.",
              },
              {
                title: "Verifica la identidad del comprador",
                description:
                  "Pide cédula de identidad al comprador antes de permitir una prueba de manejo. Toma foto del documento.",
              },
              {
                title: "Acompaña la prueba de manejo",
                description:
                  "Nunca dejes que un desconocido maneje tu carro solo. Siempre acompaña la prueba y lleva tus documentos contigo.",
              },
              {
                title: "Usa métodos de pago seguros",
                description:
                  "Prefiere transferencias bancarias verificables. Confirma que el pago sea efectivo antes de entregar el vehículo y la documentación.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <h3 className="text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Final note */}
          <div className="rounded-2xl border border-border bg-secondary/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Si sospechas de una publicación fraudulenta o actividad sospechosa,
              contáctanos inmediatamente. Trabajamos para mantener la plataforma
              segura para todos.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Lee también nuestros{" "}
              <Link
                href="/terminos"
                className="font-medium text-primary underline"
              >
                Términos y Condiciones
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
