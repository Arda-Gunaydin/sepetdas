import type { Metadata } from "next";
import Link from "next/link";
import { ListingStatusBadge } from "@/components/admin/listing-status-badge";
import { StatTile } from "@/components/admin/stat-tile";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card, PageTitle } from "@/components/ui/card";
import { istanbulDayStartIso, onlineSinceIso, requireAdmin } from "@/lib/admin";
import { LISTING_TYPE_LABELS } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { formatAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Yönetici paneli" };

type RecentListing = {
  id: string;
  type: Enums<"listing_type">;
  restaurant: string;
  status: Enums<"listing_status">;
  created_at: string;
  expires_at: string;
  owner: { id: string; full_name: string } | null;
  dorm: { name: string; city: string } | null;
};

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const todayIso = istanbulDayStartIso();
  const count = { count: "exact", head: true } as const;

  const [users, usersToday, online, activeListings, listingsToday, revealsToday, openReports, pendingRequests, suspended, dormStats, recent] =
    await Promise.all([
      supabase.from("profiles").select("id", count),
      supabase.from("profiles").select("id", count).gte("created_at", todayIso),
      supabase.from("user_activity").select("user_id", count).gt("last_seen_at", onlineSinceIso()),
      supabase.from("listings").select("id", count).eq("status", "active").gt("expires_at", nowIso),
      supabase.from("listings").select("id", count).gte("created_at", todayIso),
      supabase.from("phone_reveals").select("id", count).gte("created_at", todayIso),
      supabase.from("reports").select("id", count).eq("status", "open"),
      supabase.from("dorm_requests").select("id", count).eq("status", "pending"),
      supabase.from("profiles").select("id", count).in("status", ["suspended", "banned"]),
      supabase.rpc("admin_dorm_stats", { p_limit: 10 }),
      supabase
        .from("listings")
        .select("id, type, restaurant, status, created_at, expires_at, owner:profiles!listings_owner_id_fkey(id, full_name), dorm:dorms(name, city)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
  const recentListings = (recent.data ?? []) as RecentListing[];

  return (
    <>
      <AutoRefresh />
      <PageTitle title="Genel bakış" description="Bugün: İstanbul saatiyle gece yarısından beri" />

      <section aria-label="Özet sayılar" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Toplam kullanıcı" value={users.count ?? 0} hint={`Bugün +${usersToday.count ?? 0}`} href="/admin/kullanicilar" />
        <StatTile label="Şu an çevrim içi" value={online.count ?? 0} hint="Son 2 dakikada sitede" href="/admin/kullanicilar?durum=cevrimici" />
        <StatTile label="Şu an aktif ilan" value={activeListings.count ?? 0} href="/admin/ilanlar?durum=aktif" />
        <StatTile label="Bugün açılan ilan" value={listingsToday.count ?? 0} href="/admin/ilanlar" />
        <StatTile label="Bugün numara açma" value={revealsToday.count ?? 0} />
        <StatTile label="Açık şikayet" value={openReports.count ?? 0} href="/admin/sikayetler" attention />
        <StatTile label="Bekleyen yurt talebi" value={pendingRequests.count ?? 0} href="/admin/talepler" attention />
        <StatTile label="Askıda / engelli hesap" value={suspended.count ?? 0} href="/admin/kullanicilar?durum=askida" attention />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-labelledby="yurtlar" className="flex flex-col gap-3">
          <h2 id="yurtlar" className="text-lg font-bold">
            En kalabalık yurtlar
          </h2>
          <Card className="overflow-x-auto p-0">
            {dormStats.data && dormStats.data.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Yurt</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Kullanıcı</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">İlan</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dormStats.data.map((d) => (
                    <tr key={d.dorm_id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/kullanicilar?yurt=${d.dorm_id}`}
                          className="font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          {d.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{d.city}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.user_count}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.listing_count}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d.active_listing_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-muted-foreground">Henüz kullanıcı yok.</p>
            )}
          </Card>
        </section>

        <section aria-labelledby="son-ilanlar" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="son-ilanlar" className="text-lg font-bold">
              Son ilanlar
            </h2>
            <Link href="/admin/ilanlar" className="flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-2 hover:underline">
              Tümü
            </Link>
          </div>
          <Card className="p-0">
            {recentListings.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentListings.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/ilan/${l.id}`} className="font-semibold break-words text-accent underline-offset-2 hover:underline">
                        {l.restaurant}
                      </Link>
                      <p className="text-muted-foreground">
                        {LISTING_TYPE_LABELS[l.type]} ·{" "}
                        {l.owner ? (
                          <Link href={`/admin/kullanicilar/${l.owner.id}`} className="underline-offset-2 hover:underline">
                            {l.owner.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}{" "}
                        · {l.dorm?.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <ListingStatusBadge status={l.status} expiresAt={l.expires_at} nowIso={nowIso} />
                      <span className="text-xs text-muted-foreground">{formatAgo(l.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-muted-foreground">Henüz ilan yok.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
