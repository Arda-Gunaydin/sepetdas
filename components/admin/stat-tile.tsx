import Link from "next/link";

type Props = { label: string; value: number; hint?: string; href?: string; attention?: boolean };

/** Sayı kutusu: etiket (ikincil metin) + değer. Renk sadece dikkat gerektiren durum için kenarlıkta. */
export function StatTile({ label, value, hint, href, attention = false }: Props) {
  const body = (
    <>
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="text-3xl font-extrabold text-foreground">{value.toLocaleString("tr-TR")}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </>
  );
  const cls = `flex flex-col gap-1 rounded-2xl border bg-surface p-4 ${
    attention && value > 0 ? "border-destructive/50 ring-1 ring-destructive/20" : "border-border"
  }`;
  return href ? (
    <Link href={href} className={`${cls} transition-colors duration-150 hover:bg-muted/40`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
