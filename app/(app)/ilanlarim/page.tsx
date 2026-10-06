import { ListChecks, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing/listing-card";
import { ListingTimer } from "@/components/listing/listing-timer";
import { OwnerActions } from "@/components/listing/owner-actions";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState, PageTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireProfile } from "@/lib/auth";
import { LISTING_COLUMNS, type ListingWithOwner } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "İlanlarım" };

export default async function MyListingsPage({ searchParams }: PageProps<"/ilanlarim">) {
  const profile = await requireProfile();
  const { durum } = await searchParams;

  // RLS sadece yaşayan ilanları döndürür; süresi dolan / kapanan ilanlar sahibine de görünmez.
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("owner_id", profile.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  const listings = (data ?? []) as ListingWithOwner[];

  return (
    <>
      <PageTitle
        title="İlanlarım"
        description="İlanlar 15 dakika açık kalır. Son 2 dakikada uzatmazsan kaldırılır."
      />

      {durum === "eslesti" ? (
        <Notice tone="success" title="Afiyet olsun!">
          İlanın eşleşti olarak kapatıldı ve panodan kaldırıldı.
        </Notice>
      ) : durum === "kapandi" ? (
        <Notice tone="info">İlanın kapatıldı ve panodan kaldırıldı.</Notice>
      ) : null}

      <section aria-labelledby="aktif" className="flex flex-col gap-3">
        <h2 id="aktif" className="text-lg font-bold">
          Aktif ({listings.length}/2)
        </h2>
        {listings.length === 0 ? (
          <EmptyState icon={<ListChecks className="size-7" aria-hidden />} title="Aktif ilanın yok">
            {profile.status === "active" ? (
              <Link href="/ilan/yeni" className={buttonClasses("primary", "md", "mt-2")}>
                <Plus className="size-5" aria-hidden />
                İlan aç
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-6">
            {listings.map((listing) => (
              <li key={listing.id} className="flex flex-col gap-2">
                <ListingCard listing={listing} isOwn={false} />
                <ListingTimer listingId={listing.id} expiresAt={listing.expires_at} isOwner compact />
                <OwnerActions listingId={listing.id} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
