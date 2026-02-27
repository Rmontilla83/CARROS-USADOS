import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">CarrosUsados</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Tu carro es tu mejor vitrina
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
              Publica tu vehículo, recibe un vinil QR, pégalo en tu carro y
              deja que los compradores escaneen para ver todos los detalles.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="rounded-lg bg-accent px-8 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Publicar mi carro — $10
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              ¿Cómo funciona?
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Publica",
                  description:
                    "Sube las fotos, datos y precio de tu vehículo en minutos.",
                },
                {
                  step: "2",
                  title: "Recibe tu QR",
                  description:
                    "Te entregamos un vinil QR profesional para pegar en tu carro.",
                },
                {
                  step: "3",
                  title: "Vende",
                  description:
                    "Los interesados escanean el QR y ven toda la info. Te contactan por WhatsApp.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured vehicles placeholder */}
        <section className="bg-secondary py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Vehículos Destacados
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              Próximamente — los primeros carros publicados aparecerán aquí.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CarrosUsados. Barcelona,
            Anzoátegui, Venezuela.
          </p>
        </div>
      </footer>
    </div>
  );
}
