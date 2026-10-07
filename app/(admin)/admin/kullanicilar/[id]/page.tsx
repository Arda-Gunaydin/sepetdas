import { ChevronLeft, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingStatusBadge } from "@/components/admin/listing-status-badge";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusButtons } from "@/components/admin/status-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isOnline, requireAdmin } from "@/lib/admin";
import { formatTL, LISTING_TYPE_LABELS, PLATFORM_LABELS, PROFILE_STATUS_LABELS, REPORT_REASON_LABELS } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { formatAgo, formatDateTime } from "@/lib/time";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Kullanıcı" };

type ListingRow = {
  id: string;
  type: Enums<"listing_type">;
  platform: Enums<"listing_platform">;
  restaurant: string;
  description: string | null;
  missing_amount: number | null;
  price_per_person: number | null;
  status: Enums<"listing_status">;
  created_at: string;
  expires_at: string;
  dorm: { name: string } | null;
  reveals: { count: number }[];
};

type ReportRow = {
  id: number;
  reason: Enums<"report_reason">;
  note: string | null;
  status: Enums<"report_status">;
  created_at: string;
  listing: { id: string; restaurant: string } | null;
  other: { id: string; full_name: string } | null;
};

function ReportList({ rows, otherLabel }: { rows: ReportRow[]; otherLabel: string }) {
  return (
    rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">Kayıt yok.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Card className="flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="danger">{REPORT_REASON_LABELS[r.reason]}</Badge>
                <Badge tone={r.status === "open" ? "warning" : "neutral"}>{r.status === "open" ? "Açık" : "Çözüldü"}</Badge>
                <span className="text-muted-foreground">{formatDateTime(r.created_at)}</span>
              </div>
              <p>
                {otherLabel}:{" "}
                {r.other ? (
                  <Link href={`/admin/kullanicilar/${r.other.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                    {r.other.full_name}
                  </Link>
                ) : (
                  "—"
                )}
                {r.listing ? (
                  <>
                    {" "}· İlan:{" "}
                    <Link href={`/ilan/${r.listing.id}`} className="text-accent underline-offset-2 hover:underline">
                      {r.listing.restaurant}
                    </Link>
                  </>
                ) : null}
              </p>
              {r.note ? <p className="rounded-lg bg-muted p-2 break-words">{r.note}</p> : null}
            </Card>
          </li>
        ))}
      </ul>
    )
  );
}

export default async function AdminUserPage({ params }: PageProps<"/admin/kullanicilar/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("profiles")
    .select("id, full_name, block, status, is_admin, created_at, dorm:dorms(name, city), activity:user_activity(last_seen_at)")
    .eq("id", id)
    .maybeSingle();
  if (!user) notFound();

  const nowIso = new Date().toISOString();
  const [emailRes, listingsRes, against, by, revealsBy] = await Promise.all([
    supabase.rpc("admin_user_email", { p_user_id: id }),
    supabase
      .from("listings")
      .select("id, type, platform, restaurant, description, missing_amount, price_per_person, status, created_at, expires_at, dorm:dorms(name), reveals:phone_reveals(count)")
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("reports")
      .select("id, reason, note, status, created_at, listing:listings(id, restaurant), other:profiles!reports_reporter_id_fkey(id, full_name)")
      .eq("reported_user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, reason, note, status, created_at, listing:listings(id, restaurant), other:profiles!reports_reported_user_id_fkey(id, full_name)")
      .eq("reporter_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("phone_reveals").select("id", { count: "exact", head: true }).eq("viewer_id", id),
  ]);
  const email = emailRes.data;
  const lastSeenAt = user.activity?.last_seen_at ?? null;
  const listings = (listingsRes.data ?? []) as unknown as ListingRow[];
  const reportsAgainst = (against.data ?? []) as unknown as ReportRow[];
  const reportsBy = (by.data ?? []) as unknown as ReportRow[];
  const matched = listings.filter((l) => l.status === "matched").length;
  const revealsReceived = listings.reduce((sum, l) => sum + (l.reveals[0]?.count ?? 0), 0);

  return (
    <>
      <Link href="/admin/kullanicilar" className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-5" aria-hidden />
        Kullanıcılar
      </Link>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{user.full_name}</h1>
            <p className="text-muted-foreground">
              {user.dorm?.name} · {user.dorm?.city}
              {user.block ? ` · ${user.block}` : ""}
            </p>
            {email ? (
              <a href={`mailto:${email}`} className="w-fit text-sm font-semibold break-all text-accent underline-offset-2 hover:underline">
                {email}
              </a>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Katılma: {formatDateTime(user.created_at)} ·{" "}
              {lastSeenAt ? `Son görülme: ${formatAgo(lastSeenAt)}` : "Henüz görülmedi"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge tone={user.status === "active" ? "success" : user.status === "banned" ? "danger" : "warning"}>
              {PROFILE_STATUS_LABELS[user.status]}
            </Badge>
            {user.is_admin ? <Badge tone="accent">Yönetici</Badge> : null}
            {isOnline(lastSeenAt) ? <Badge tone="success">Çevrim içi</Badge> : null}
          </div>
        </div>
        {user.id !== admin.id ? <StatusButtons userId={user.id} current={user.status} /> : null}
        <p className="text-xs text-muted-foreground">
          Telefon numarası gizlilik kuralı gereği yönetici panelinde de gösterilmez. E-posta yalnızca kullanıcıyla
          iletişim için gösterilir; paylaşma.
        </p>
      </Card>

      <section aria-label="Kullanıcı sayıları" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Toplam ilan" value={listings.length} />
        <StatTile label="Eşleşen ilan" value={matched} />
        <StatTile label="İlanlarına numara açma" value={revealsReceived} />
        <StatTile label="Açtığı numara" value={revealsBy.count ?? 0} />
        <StatTile label="Hakkındaki şikayet" value={reportsAgainst.length} attention />
      </section>

      <section aria-labelledby="ilanlari" className="flex flex-col gap-3">
        <h2 id="ilanlari" className="text-lg font-bold">
          Verdiği ilanlar
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz ilan vermemiş.</p>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2">
            {listings.map((l) => (
              <li key={l.id}>
                <Card className="flex h-full flex-col gap-1.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <ListingStatusBadge status={l.status} expiresAt={l.expires_at} nowIso={nowIso} />
                    <Badge tone="primary">{LISTING_TYPE_LABELS[l.type]}</Badge>
                    <Badge tone="accent">{PLATFORM_LABELS[l.platform]}</Badge>
                    <span className="ml-auto flex items-center gap-1 text-muted-foreground" title="Numarayı açan kişi sayısı">
                      <Eye className="size-4" aria-hidden />
                      {l.reveals[0]?.count ?? 0}
                    </span>
                  </div>
                  <Link href={`/ilan/${l.id}`} className="text-base font-bold break-words text-accent underline-offset-2 hover:underline">
                    {l.restaurant}
                  </Link>
                  {l.missing_amount ? <p>{formatTL(l.missing_amount)} eksik</p> : null}
                  {l.price_per_person ? <p>Kişi başı {formatTL(l.price_per_person)}</p> : null}
                  {l.description ? <p className="break-words text-muted-foreground">{l.description}</p> : null}
                  <p className="mt-auto text-xs text-muted-foreground">
                    {formatDateTime(l.created_at)} → {formatDateTime(l.expires_at)}
                    {l.dorm ? ` · ${l.dorm.name}` : ""}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="hakkinda" className="flex flex-col gap-3">
          <h2 id="hakkinda" className="text-lg font-bold">
            Hakkındaki şikayetler
          </h2>
          <ReportList rows={reportsAgainst} otherLabel="Şikayet eden" />
        </section>
        <section aria-labelledby="yaptigi" className="flex flex-col gap-3">
          <h2 id="yaptigi" className="text-lg font-bold">
            Yaptığı şikayetler
          </h2>
          <ReportList rows={reportsBy} otherLabel="Şikayet edilen" />
        </section>
      </div>
    </>
  );
}
