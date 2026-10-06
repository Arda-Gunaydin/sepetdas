import { Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListingStatusBadge } from "@/components/admin/listing-status-badge";
import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, PageTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { formatTL, LISTING_STATUS_LABELS, LISTING_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tüm ilanlar" };

const PAGE_SIZE = 50;
const FILTERS = [
  { key: "", label: "Hepsi" },
  { key: "aktif", label: "Aktif" },
  { key: "suresi-doldu", label: "Süresi doldu" },
  { key: "eslesti", label: "Eşleşti" },
  { key: "kapandi", label: "Kapatıldı" },
  { key: "gizli", label: "Gizlendi" },
] as const;

type Row = {
  id: string;
  type: keyof typeof LISTING_TYPE_LABELS;
  platform: keyof typeof PLATFORM_LABELS;
  restaurant: string;
  description: string | null;
  missing_amount: number | null;
  price_per_person: number | null;
  status: keyof typeof LISTING_STATUS_LABELS;
  created_at: string;
  expires_at: string;
  owner: { id: string; full_name: string } | null;
  dorm: { name: string; city: string } | null;
  reveals: { count: number }[];
};

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/ilanlar">) {
  await requireAdmin();

  const params = await searchParams;
  const filter = FILTERS.find((f) => f.key === params.durum)?.key ?? "";
  const page = Math.max(1, Number.parseInt(String(params.sayfa ?? "1"), 10) || 1);
  const nowIso = new Date().toISOString();

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(
      "id, type, platform, restaurant, description, missing_amount, price_per_person, status, created_at, expires_at, owner:profiles!listings_owner_id_fkey(id, full_name), dorm:dorms(name, city), reveals:phone_reveals(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filter === "aktif") query = query.eq("status", "active").gt("expires_at", nowIso);
  if (filter === "suresi-doldu") query = query.eq("status", "active").lte("expires_at", nowIso);
  if (filter === "eslesti") query = query.eq("status", "matched");
  if (filter === "kapandi") query = query.eq("status", "closed");
  if (filter === "gizli") query = query.eq("status", "hidden");
  const { data, count } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const href = (next: { durum?: string; sayfa?: number }) => {
    const qs = new URLSearchParams();
    const d = next.durum ?? filter;
    if (d) qs.set("durum", d);
    if (next.sayfa && next.sayfa > 1) qs.set("sayfa", String(next.sayfa));
    const s = qs.toString();
    return s ? `/admin/ilanlar?${s}` : "/admin/ilanlar";
  };

  return (
    <>
      <PageTitle title="İlanlar" description={`Geçmiş ve şimdiki tüm ilanlar · ${count ?? 0} kayıt`} />

      <nav aria-label="Durum filtresi" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ durum: f.key, sayfa: 1 })}
            aria-current={filter === f.key ? "true" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap ${
              filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-input/40 bg-surface hover:bg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">Bu filtrede ilan yok.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => {
            return (
              <li key={r.id}>
                <Card className="flex h-full flex-col gap-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <ListingStatusBadge status={r.status} expiresAt={r.expires_at} nowIso={nowIso} />
                    <Badge tone="primary">{LISTING_TYPE_LABELS[r.type]}</Badge>
                    <Badge tone="accent">{PLATFORM_LABELS[r.platform]}</Badge>
                    <span className="ml-auto flex items-center gap-1 text-muted-foreground" title="Numarayı açan kişi sayısı">
                      <Eye className="size-4" aria-hidden />
                      {r.reveals[0]?.count ?? 0}
                    </span>
                  </div>
                  <Link href={`/ilan/${r.id}`} className="text-base font-bold break-words text-accent underline-offset-2 hover:underline">
                    {r.restaurant}
                  </Link>
                  {r.missing_amount ? <p>{formatTL(r.missing_amount)} eksik</p> : null}
                  {r.price_per_person ? <p>Kişi başı {formatTL(r.price_per_person)}</p> : null}
                  {r.description ? <p className="break-words text-muted-foreground">{r.description}</p> : null}
                  <p>
                    {r.owner ? (
                      <Link href={`/admin/kullanicilar/${r.owner.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                        {r.owner.full_name}
                      </Link>
                    ) : (
                      "—"
                    )}{" "}
                    · {r.dorm?.name} ({r.dorm?.city})
                  </p>
                  <p className="mt-auto text-muted-foreground">
                    Açıldı {formatDateTime(r.created_at)} · Bitiş {formatDateTime(r.expires_at)}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => href({ sayfa: p })} />
    </>
  );
}
