import { formatTL } from "@/lib/labels";
import type { ListingWithOwner } from "@/lib/listings";

/** İlanın öne çıkan rakamı: "50 TL eksik", "Kişi başı 300 TL" ... */
export function ListingHighlight({ listing }: { listing: Pick<ListingWithOwner, "type" | "missing_amount" | "price_per_person" | "people_needed"> }) {
  const people = listing.people_needed > 1 ? ` · ${listing.people_needed} kişi aranıyor` : "";
  if (listing.type === "min_basket" && listing.missing_amount) {
    return (
      <p className="text-lg font-extrabold text-primary">
        {formatTL(listing.missing_amount)} eksik
        <span className="text-sm font-semibold text-muted-foreground">{people}</span>
      </p>
    );
  }
  if (listing.type === "shared_menu") {
    return (
      <p className="text-lg font-extrabold text-primary">
        {listing.price_per_person ? `Kişi başı ${formatTL(listing.price_per_person)}` : "Menü paylaşımı"}
        <span className="text-sm font-semibold text-muted-foreground">{people}</span>
      </p>
    );
  }
  return (
    <p className="text-lg font-extrabold text-primary">
      Teslimat ücreti bölüşülür
      <span className="text-sm font-semibold text-muted-foreground">{people}</span>
    </p>
  );
}
