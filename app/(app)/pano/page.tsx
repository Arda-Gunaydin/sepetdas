import { Plus, SearchX, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ListingCard } from "@/components/listing/listing-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState, PageTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { LISTING_TYPE_LABELS, LISTING_TYPES, PLATFORM_LABELS, PLATFORMS } from "@/lib/labels";
import { LISTING_COLUMNS, type ListingWithOwner } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pano" };

function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-input/40 bg-surface text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function BoardPage({ searchParams }: PageProps<"/pano">) {
  const profile = await requireProfile();
  const params = await searchParams;
  const type = pick(params.tur, LISTING_TYPES);
  const platform = pick(params.platform, PLATFORMS);

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("dorm_id", profile.dorm_id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);
  if (type) query = query.eq("type", type);
  if (platform) query = query.eq("platform", platform);
  const { data, error } = await query;
  const listings = (data ?? []) as ListingWithOwner[];

  const href = (next: { tur?: string; platform?: string }) => {
    const qs = new URLSearchParams();
    const t = "tur" in next ? next.tur : type;
    const p = "platform" in next ? next.platform : platform;
    if (t) qs.set("tur", t);
    if (p) qs.set("platform", p);
    const s = qs.toString();
    return s ? `/pano?${s}` : "/pano";
  };

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageTitle
        title="Pano"
        description={`${profile.dorm?.name ?? "Yurdun"} için aktif ilanlar`}
        action={
          profile.status === "active" ? (
            <Link href="/ilan/yeni" className={buttonClasses("primary", "md", "shrink-0")}>
              <Plus className="size-5" aria-hidden />
              İlan aç
            </Link>
          ) : null
        }
      />

      <nav aria-label="İlan türü filtresi" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip href={href({ tur: undefined })} active={!type}>
          Tümü
        </FilterChip>
        {LISTING_TYPES.map((t) => (
          <FilterChip key={t} href={href({ tur: t })} active={type === t}>
            {LISTING_TYPE_LABELS[t]}
          </FilterChip>
        ))}
      </nav>
      <nav aria-label="Platform filtresi" className="-mx-4 -mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip href={href({ platform: undefined })} active={!platform}>
          Tüm platformlar
        </FilterChip>
        {PLATFORMS.map((p) => (
          <FilterChip key={p} href={href({ platform: p })} active={platform === p}>
            {PLATFORM_LABELS[p]}
          </FilterChip>
        ))}
      </nav>

      {error ? (
        <EmptyState icon={<SearchX className="size-7" aria-hidden />} title="İlanlar yüklenemedi">
          Sayfayı yenilemeyi dene.
        </EmptyState>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="size-7" aria-hidden />}
          title={type || platform ? "Bu filtrede ilan yok" : "Şu an aktif ilan yok"}
        >
          {type || platform ? (
            <Link href="/pano" className="font-semibold text-accent underline underline-offset-2">
              Filtreleri temizle
            </Link>
          ) : (
            "Sipariş vermeyi düşünüyorsan ilan aç; yurdundan biri görünce sana ulaşsın. İlanlar 15 dakika panoda kalır."
          )}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} isOwn={listing.owner_id === profile.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
