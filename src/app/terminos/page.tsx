import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: `Términos y condiciones de uso de ${APP_NAME}. Lee las condiciones del servicio antes de publicar tu vehículo.`,
};

export default function TerminosPage() {
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
            <div className="rounded-xl bg-primary/10 p-3">
              <FileText className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Términos y Condiciones
              </h1>
              <p className="text-sm text-muted-foreground">
                Última actualización: Febrero 2026
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none space-y-8">
            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                1. Naturaleza del Servicio
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {APP_NAME} es una plataforma digital que facilita la publicación y
                visibilidad de vehículos usados en venta mediante tarjetas digitales
                y viniles QR físicos. El servicio se limita exclusivamente a la
                publicación de información proporcionada por el vendedor y a la
                generación de material promocional (vinil QR).
              </p>
            </section>

            <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-lg font-bold text-red-800 mb-3">
                2. Renuncia de Responsabilidad — IMPORTANTE
              </h2>
              <ul className="space-y-3 text-sm leading-relaxed text-red-700">
                <li className="flex gap-2">
                  <span className="mt-1 shrink-0">⚠️</span>
                  <span>
                    <strong>{APP_NAME} NO interviene</strong> en ninguna
                    transacción de compra/venta de vehículos. No somos
                    intermediarios, corredores ni parte en la negociación.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 shrink-0">⚠️</span>
                  <span>
                    <strong>{APP_NAME} NO garantiza</strong> los precios publicados,
                    el estado real de los vehículos, ni la veracidad, exactitud o
                    completitud de la información proporcionada por los vendedores.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 shrink-0">⚠️</span>
                  <span>
                    Los <strong>precios sugeridos por inteligencia artificial</strong>{" "}
                    son estimaciones <strong>REFERENCIALES</strong> basadas en datos
                    de mercado disponibles públicamente. No constituyen una tasación
                    profesional, avalúo oficial ni recomendación financiera.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 shrink-0">⚠️</span>
                  <span>
                    <strong>{APP_NAME} NO es responsable</strong> de fraudes,
                    estafas, engaños, robos, daños o cualquier problema que surja
                    entre comprador y vendedor antes, durante o después de una
                    transacción.
                  </span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                3. Responsabilidad del Vendedor
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>
                  El vendedor es <strong>100% responsable</strong> de toda la
                  información publicada sobre su vehículo, incluyendo fotos, datos
                  técnicos, precio, descripción y condiciones.
                </li>
                <li>
                  El vendedor declara ser el propietario legítimo del vehículo o
                  tener autorización expresa del propietario para su venta.
                </li>
                <li>
                  El vendedor se compromete a no publicar información falsa,
                  engañosa o que induzca a error sobre el estado, historial o
                  características del vehículo.
                </li>
                <li>
                  {APP_NAME} se reserva el derecho de eliminar publicaciones que
                  considere fraudulentas, engañosas o que violen estos términos.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                4. Responsabilidad del Comprador
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>
                  El comprador es responsable de verificar personalmente toda la
                  información del vehículo antes de realizar cualquier pago o
                  compromiso de compra.
                </li>
                <li>
                  Se recomienda encarecidamente verificar documentos originales,
                  realizar inspección mecánica independiente y verificar la
                  situación legal del vehículo (CICPC/SIPOL).
                </li>
                <li>
                  Consulta nuestras{" "}
                  <Link
                    href="/seguridad"
                    className="font-medium text-primary underline"
                  >
                    recomendaciones de seguridad
                  </Link>{" "}
                  antes de concretar cualquier compra.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                5. Servicio de Publicación
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>
                  El costo del servicio cubre la publicación digital por 60 días y
                  la generación del vinil QR físico con entrega a domicilio.
                </li>
                <li>
                  El pago no es reembolsable una vez que la publicación ha sido
                  activada y/o el vinil QR ha sido generado.
                </li>
                <li>
                  {APP_NAME} se reserva el derecho de modificar los precios del
                  servicio con notificación previa.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                6. Propiedad Intelectual
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Todo el contenido de la plataforma (diseño, código, marca, logo) es
                propiedad de {APP_NAME}. Las fotos y contenido publicado por los
                vendedores son responsabilidad de cada vendedor. Al publicar, el
                vendedor otorga a {APP_NAME} licencia para mostrar dicho contenido
                en la plataforma.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                7. Modificaciones
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {APP_NAME} puede modificar estos términos en cualquier momento. Las
                modificaciones serán efectivas desde su publicación en esta página.
                El uso continuado de la plataforma implica la aceptación de los
                términos vigentes.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                8. Jurisdicción
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Estos términos se rigen por las leyes de la República Bolivariana de
                Venezuela. Cualquier controversia será resuelta ante los tribunales
                competentes de la ciudad de Barcelona, estado Anzoátegui.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
