export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="flex flex-col gap-3">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 animate-pulse rounded-full bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
