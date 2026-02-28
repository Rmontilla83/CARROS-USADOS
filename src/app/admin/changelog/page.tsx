import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import changelog from "@/data/changelog.json";

export const metadata: Metadata = {
  title: "Novedades — Admin",
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string; className: string }> = {
  feature: { emoji: "🆕", label: "Nueva funcionalidad", className: "bg-accent/10 text-accent border-accent/20" },
  improvement: { emoji: "🔧", label: "Mejora", className: "bg-blue-100 text-blue-700 border-blue-300" },
  fix: { emoji: "🐛", label: "Fix", className: "bg-orange-100 text-orange-700 border-orange-300" },
  security: { emoji: "🔒", label: "Seguridad", className: "bg-purple-100 text-purple-700 border-purple-300" },
};

export default function ChangelogPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novedades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de cambios y actualizaciones de la plataforma
        </p>
      </div>

      <div className="mt-6 space-y-8">
        {changelog.map((release) => {
          const releaseDate = new Date(release.date);
          const isRecent =
            Date.now() - releaseDate.getTime() < 7 * 24 * 60 * 60 * 1000;

          return (
            <div key={release.version} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  v{release.version}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {releaseDate.toLocaleDateString("es-VE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {isRecent && (
                  <Badge className="bg-accent/10 text-accent border-accent/20 border text-[10px]">
                    Nuevo
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {release.entries.map((entry) => {
                  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.feature;
                  return (
                    <div key={entry.title} className="flex gap-3">
                      <span className="mt-0.5 text-base">{config.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {entry.title}
                          </p>
                          <Badge className={`border text-[10px] ${config.className}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
