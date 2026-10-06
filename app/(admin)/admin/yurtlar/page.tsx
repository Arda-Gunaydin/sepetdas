import { Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DormForm } from "@/components/admin/dorm-form";
import { Pagination } from "@/components/admin/pagination";
import { CityOptions } from "@/components/profile/city-options";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { inputClasses } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteDorm, setDormActive } from "@/lib/actions/admin";
import { likePattern, requireAdmin } from "@/lib/admin";
import { CITIES } from "@/lib/cities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Yurtlar" };

const PAGE_SIZE = 50;

type DormRow = {
  id: number;
  city: string;
  name: string;
  is_active: boolean;
  profiles: { count: number }[];
  listings: { count: number }[];
};

export default async function AdminDormsPage({ searchParams }: PageProps<"/admin/yurtlar">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const city = typeof params.il === "string" && (CITIES as readonly string[]).includes(params.il) ? params.il : "";
  const status = params.durum === "aktif" || params.durum === "pasif" ? params.durum : "";
  const page = Math.max(1, Number.parseInt(String(params.sayfa ?? "1"), 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("dorms")
    .select("id, city, name, is_active, profiles(count), listings(count)", { count: "exact" })
    .order("city")
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", likePattern(q));
  if (city) query = query.eq("city", city);
  if (status === "aktif") query = query.eq("is_active", true);
  if (status === "pasif") query = query.eq("is_active", false);
  const { data, count } = await query;
  const dorms = (data ?? []) as unknown as DormRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (city) qs.set("il", city);
    if (status) qs.set("durum", status);
    if (p > 1) qs.set("sayfa", String(p));
    const s = qs.toString();
    return s ? `/admin/yurtlar?${s}` : "/admin/yurtlar";
  };

  return (
    <>
      <PageTitle
        title="Yurtlar"
        description="Listeden kaldırılan yurt kayıt ekranında görünmez; o yurttaki kullanıcılar yurtlarında kalır. Sadece hiç kullanıcısı ve ilanı olmayan yurt kalıcı silinebilir."
      />

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Yeni yurt ekle</h2>
        <p className="text-sm text-muted-foreground">Yurdun resmi adını GSB / KYGM kaynaklarından doğrula.</p>
        <DormForm />
      </Card>

      <form method="get" className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]" role="search">
        <label className="sr-only" htmlFor="q">Yurt adıyla ara</label>
        <input id="q" name="q" defaultValue={q} placeholder="Yurt adıyla ara" className={inputClasses} />
        <label className="sr-only" htmlFor="il">İl</label>
        <select id="il" name="il" defaultValue={city} className={`${inputClasses} cursor-pointer`}>
          <option value="">Tüm iller</option>
          <CityOptions />
        </select>
        <label className="sr-only" htmlFor="durum">Durum</label>
        <select id="durum" name="durum" defaultValue={status} className={`${inputClasses} cursor-pointer`}>
          <option value="">Hepsi</option>
          <option value="aktif">Listede</option>
          <option value="pasif">Kaldırılmış</option>
        </select>
        <button type="submit" className={buttonClasses("primary", "md")}>
          <Search className="size-5" aria-hidden />
          Filtrele
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{count ?? 0} yurt</span>
        {q || city || status ? (
          <Link href="/admin/yurtlar" className="flex min-h-11 items-center gap-1 font-semibold text-accent underline-offset-2 hover:underline">
            <X className="size-4" aria-hidden />
            Filtreleri temizle
          </Link>
        ) : null}
      </div>

      {dorms.length === 0 ? (
        <p className="text-muted-foreground">Bu filtrede yurt yok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dorms.map((d) => {
            const users = d.profiles[0]?.count ?? 0;
            const listings = d.listings[0]?.count ?? 0;
            const deletable = users === 0 && listings === 0;
            return (
              <li key={d.id}>
                <Card className={`flex flex-col gap-3 text-sm ${d.is_active ? "" : "bg-muted/40"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold break-words">{d.name}</p>
                      <p className="text-muted-foreground">
                        {d.city} ·{" "}
                        {users > 0 ? (
                          <Link href={`/admin/kullanicilar?yurt=${d.id}`} className="text-accent underline-offset-2 hover:underline">
                            {users} kullanıcı
                          </Link>
                        ) : (
                          "0 kullanıcı"
                        )}{" "}
                        · {listings} ilan
                      </p>
                    </div>
                    <Badge tone={d.is_active ? "success" : "neutral"}>{d.is_active ? "Listede" : "Kaldırılmış"}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setDormActive}>
                      <input type="hidden" name="dorm_id" value={d.id} />
                      <input type="hidden" name="active" value={d.is_active ? "false" : "true"} />
                      <SubmitButton size="sm" variant={d.is_active ? "secondary" : "success"}>
                        {d.is_active ? "Listeden kaldır" : "Listeye geri al"}
                      </SubmitButton>
                    </form>
                    {deletable ? (
                      <form action={deleteDorm}>
                        <input type="hidden" name="dorm_id" value={d.id} />
                        <SubmitButton size="sm" variant="danger">
                          Kalıcı sil
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>

                  <details className="group">
                    <summary className="flex min-h-11 w-fit cursor-pointer items-center font-semibold text-accent">Adını / ilini düzenle</summary>
                    <div className="pt-2">
                      <DormForm dorm={{ id: d.id, city: d.city, name: d.name }} />
                    </div>
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
