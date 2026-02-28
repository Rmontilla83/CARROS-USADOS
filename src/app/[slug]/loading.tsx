import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleCardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar skeleton */}
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-lg">
        {/* Gallery skeleton */}
        <Skeleton className="aspect-[4/3] w-full" />

        <div className="space-y-5 p-4">
          {/* Title + Price */}
          <div>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="mt-2 h-4 w-40" />
            <Skeleton className="mt-3 h-9 w-32" />
          </div>

          {/* WhatsApp button */}
          <Skeleton className="h-12 w-full rounded-lg" />

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Specs grid */}
          <div>
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
