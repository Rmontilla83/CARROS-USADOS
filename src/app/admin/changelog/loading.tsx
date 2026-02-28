export default function Loading() {
  return (
    <div>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-secondary" />
      <div className="mt-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
