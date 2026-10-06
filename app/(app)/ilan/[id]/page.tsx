import { ChevronLeft, Flag, History, MapPin, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingHighlight } from "@/components/listing/listing-summary";
import { ListingTimer } from "@/components/listing/listing-timer";
import { OwnerActions } from "@/components/listing/owner-actions";
import { ReportForm } from "@/components/listing/report-form";
import { RevealPhone } from "@/components/listing/reveal-phone";
import { ListingTypeIcon } from "@/components/listing/type-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireProfile } from "@/lib/auth";
import { firstNameWithInitial, LISTING_STATUS_LABELS, LISTING_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/labels";
import { isListingLive, LISTING_COLUMNS, type ListingWithOwner } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import { formatAgo } from "@/lib/time";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "İlan" };

export default async function ListingPage({ params, searchParams }: PageProps<"/ilan/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const { yeni } = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("listings").select(LISTING_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const listing = data as ListingWithOwner;

  const isOwn = listing.owner_id === profile.id;
  const live = isListingLive(listing);
  const ownerName = listing.owner ? firstNameWithInitial(listing.owner.full_name) : "İlan sahibi";
  const ownerFirstName = listing.owner?.full_name.split(" ")[0] ?? "";

  return (
    <>
      <Link href={isOwn ? "/ilanlarim" : "/pano"} className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-5" aria-hidden />
        {isOwn ? "İlanlarım" : "Pano"}
      </Link>

      {yeni === "1" && isOwn ? (
        <Notice tone="success" title="İlanın yayında">
          Yurdundaki öğrenciler artık görebilir. İlan 15 dakika açık kalır; son 2 dakikada &quot;+15 dk ekle&quot; ile
          uzatabilirsin. Biriyle anlaşınca &quot;Eşleştim&quot;e bas.
        </Notice>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            <ListingTypeIcon type={listing.type} className="size-3.5" />
            {LISTING_TYPE_LABELS[listing.type]}
          </Badge>
          <Badge tone="accent">{PLATFORM_LABELS[listing.platform]}</Badge>
          {!live ? (
            <Badge tone={listing.status === "matched" ? "success" : "neutral"}>
              {listing.status === "active" ? "Süresi doldu" : LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight break-words">{listing.restaurant}</h1>
          <ListingHighlight listing={listing} />
        </div>

        {listing.description ? <p className="whitespace-pre-line break-words">{listing.description}</p> : null}

        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Açıldı:</dt>
            <dd className="font-semibold">{formatAgo(listing.created_at)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">İlan sahibi:</dt>
            <dd className="font-semibold">{ownerName}</dd>
          </div>
          {listing.owner?.block ? (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" aria-hidden />
              <dt className="text-muted-foreground">Blok / kat:</dt>
              <dd className="font-semibold">{listing.owner.block}</dd>
            </div>
          ) : null}
        </dl>

        {live ? <ListingTimer listingId={listing.id} expiresAt={listing.expires_at} isOwner={isOwn} /> : null}
      </Card>

      {isOwn ? (
        live ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-bold">İlanını yönet</h2>
            <OwnerActions listingId={listing.id} />
          </Card>
        ) : null
      ) : live ? (
        profile.status === "active" ? (
          <Card>
            <RevealPhone listingId={listing.id} restaurant={listing.restaurant} ownerFirstName={ownerFirstName} />
          </Card>
        ) : null
      ) : (
        <Notice tone="info">Bu ilan artık aktif değil; numara açılamaz.</Notice>
      )}

      {!isOwn && profile.status === "active" ? (
        <details className="rounded-2xl border border-border bg-surface p-4">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-muted-foreground">
            <Flag className="size-4" aria-hidden />
            Bu ilanı şikayet et
          </summary>
          <div className="mt-3">
            <ReportForm listingId={listing.id} />
          </div>
        </details>
      ) : null}
    </>
  );
}
