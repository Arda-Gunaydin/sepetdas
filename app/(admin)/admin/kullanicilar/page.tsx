import { Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { OnlineDot } from "@/components/admin/online-dot";
import { Pagination } from "@/components/admin/pagination";
import { CityOptions } from "@/components/profile/city-options";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { inputClasses } from "@/components/ui/field";
import { isOnline, likePattern, onlineSinceIso, requireAdmin } from "@/lib/admin";
import { CITIES } from "@/lib/cities";
import { PROFILE_STATUS_LABELS } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Kullanıcılar" };

const PAGE_SIZE = 50;

type UserRow = {
  id: string;
  full_name: string;
  block: string | null;
  status: Enums<"profile_status">;
  is_admin: boolean;
  created_at: string;
  dorm: { id: number; name: string; city: string };
  listings: { count: number }[];
  activity: { last_seen_at: string } | null;
};

function StatusBadge({ status, isAdmin }: { status: Enums<"profile_status">; isAdmin: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      <Badge tone={status === "active" ? "success" : status === "banned" ? "danger" : "warning"}>{PROFILE_STATUS_LABELS[status]}</Badge>
      {isAdmin ? <Badge tone="accent">Yönetici</Badge> : null}
    </span>
  );
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/kullanicilar">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const city = typeof params.il === "string" && (CITIES as readonly string[]).includes(params.il) ? params.il : "";
  const dormId = typeof params.yurt === "string" && /^\d+$/.test(params.yurt) ? Number(params.yurt) : null;
  const status = params.durum === "aktif" || params.durum === "askida" || params.durum === "cevrimici" ? params.durum : "";
  const page = Math.max(1, Number.parseInt(String(params.sayfa ?? "1"), 10) || 1);

  const supabase = await createClient();
  const now = new Date();
  // Çevrim içi filtresinde son görülme zorunlu (inner join), diğerlerinde isteğe bağlı.
  const activity = status === "cevrimici" ? "activity:user_activity!inner(last_seen_at)" : "activity:user_activity(last_seen_at)";
  let query = supabase
    .from("profiles")
    .select(`id, full_name, block, status, is_admin, created_at, dorm:dorms!inner(id, name, city), listings(count), ${activity}`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("full_name", likePattern(q));
  if (city) query = query.eq("dorm.city", city);
  if (dormId) query = query.eq("dorm_id", dormId);
  if (status === "aktif") query = query.eq("status", "active");
  if (status === "askida") query = query.in("status", ["suspended", "banned"]);
  if (status === "cevrimici") query = query.gt("activity.last_seen_at", onlineSinceIso(now));
  const { data, count, error } = await query;
  const users = (data ?? []) as unknown as UserRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { data: dormFilter } = dormId
    ? await supabase.from("dorms").select("name, city").eq("id", dormId).maybeSingle()
    : { data: null };

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (city) qs.set("il", city);
    if (dormId) qs.set("yurt", String(dormId));
    if (status) qs.set("durum", status);
    if (p > 1) qs.set("sayfa", String(p));
    const s = qs.toString();
    return s ? `/admin/kullanicilar?${s}` : "/admin/kullanicilar";
  };

  return (
    <>
      <PageTitle title="Kullanıcılar" description={`${count ?? 0} kullanıcı`} />

      <form method="get" className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]" role="search">
        {dormId ? <input type="hidden" name="yurt" value={dormId} /> : null}
        <label className="sr-only" htmlFor="q">İsimle ara</label>
        <input id="q" name="q" defaultValue={q} placeholder="İsimle ara" className={inputClasses} />
        <label className="sr-only" htmlFor="il">İl</label>
        <select id="il" name="il" defaultValue={city} className={`${inputClasses} cursor-pointer`}>
          <option value="">Tüm iller</option>
          <CityOptions />
        </select>
        <label className="sr-only" htmlFor="durum">Durum</label>
        <select id="durum" name="durum" defaultValue={status} className={`${inputClasses} cursor-pointer`}>
          <option value="">Tüm durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="askida">Askıda / engelli</option>
          <option value="cevrimici">Şu an çevrim içi</option>
        </select>
        <button type="submit" className={buttonClasses("primary", "md")}>
          <Search className="size-5" aria-hidden />
          Filtrele
        </button>
      </form>

      {dormFilter || q || city || status ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {dormFilter ? (
            <Badge tone="primary">
              Yurt: {dormFilter.name} ({dormFilter.city})
            </Badge>
          ) : null}
          <Link href="/admin/kullanicilar" className="flex min-h-11 items-center gap-1 font-semibold text-accent underline-offset-2 hover:underline">
            <X className="size-4" aria-hidden />
            Filtreleri temizle
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive">Kullanıcılar yüklenemedi.</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">Bu filtrede kullanıcı yok.</p>
      ) : (
        <>
          {/* Masaüstü: tablo */}
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Ad soyad</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Yurt</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Durum</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">İlan</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Katılma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Link href={`/admin/kullanicilar/${u.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                          {u.full_name}
                        </Link>
                        {isOnline(u.activity?.last_seen_at, now) ? <OnlineDot /> : null}
                      </span>
                      {u.block ? <span className="block text-xs text-muted-foreground">{u.block}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      {u.dorm.name}
                      <span className="block text-xs text-muted-foreground">{u.dorm.city}</span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={u.status} isAdmin={u.is_admin} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{u.listings[0]?.count ?? 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Telefon: kartlar */}
          <ul className="flex flex-col gap-2 md:hidden">
            {users.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/kullanicilar/${u.id}`} className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4 text-sm hover:bg-muted/30">
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-accent">
                      {u.full_name}
                      {isOnline(u.activity?.last_seen_at, now) ? <OnlineDot /> : null}
                    </span>
                    <StatusBadge status={u.status} isAdmin={u.is_admin} />
                  </span>
                  <span>
                    {u.dorm.name} · {u.dorm.city}
                  </span>
                  <span className="text-muted-foreground">
                    {u.listings[0]?.count ?? 0} ilan · {formatDateTime(u.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
