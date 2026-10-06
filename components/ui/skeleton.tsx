import type { ReactNode } from "react";

/** Tek iskelet parçası. Boyut ve şekli className ile verilir. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-lg ${className}`} />;
}

/** Yükleme ekranı kabı: ekran okuyuculara "Yükleniyor" der, görsel iskeleti gizler. */
export function SkeletonPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={`flex flex-col gap-5 ${className}`}>
      <span className="sr-only">Yükleniyor…</span>
      {children}
    </div>
  );
}

export function TitleSkeleton({ withAction = false, lines = 1 }: { withAction?: boolean; lines?: number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
      {withAction ? <Skeleton className="h-12 w-28 rounded-xl" /> : null}
    </div>
  );
}

/** Pano / İlanlarım kartının iskeleti. */
export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="h-6 w-2/5" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function ChipRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`h-11 shrink-0 rounded-full ${i === 0 ? "w-20" : "w-36"}`} />
      ))}
    </div>
  );
}

/** Etiket + girdi alanı iskeleti. */
export function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className={`${tall ? "h-24" : "h-12"} w-full rounded-xl`} />
    </div>
  );
}

export function CardSkeleton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</div>;
}

/** Yönetici sayı kutuları. */
export function StatTilesSkeleton({ count = 4, className = "md:grid-cols-4" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Tablo / liste satırları. */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
