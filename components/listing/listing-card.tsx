import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { firstNameWithInitial, LISTING_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/labels";
import type { ListingWithOwner } from "@/lib/listings";
import { formatAgo, formatRemaining } from "@/lib/time";
import { ListingHighlight } from "./listing-summary";
import { ListingTypeIcon } from "./type-icon";

export function ListingCard({ listing, isOwn }: { listing: ListingWithOwner; isOwn: boolean }) {
  return (
    <Link
      href={`/ilan/${listing.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-primary/40 active:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            <ListingTypeIcon type={listing.type} className="size-3.5" />
            {LISTING_TYPE_LABELS[listing.type]}
          </Badge>
          <Badge tone="accent">{PLATFORM_LABELS[listing.platform]}</Badge>
          {isOwn ? <Badge tone="success">Senin ilanın</Badge> : null}
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </div>

      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold break-words">{listing.restaurant}</h2>
        <ListingHighlight listing={listing} />
        {listing.description ? <p className="line-clamp-2 text-muted-foreground break-words">{listing.description}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          {formatRemaining(listing.expires_at)}
        </span>
        <span className="text-muted-foreground">
          {listing.owner ? firstNameWithInitial(listing.owner.full_name) : ""} · {formatAgo(listing.created_at)}
        </span>
      </div>
    </Link>
  );
}
