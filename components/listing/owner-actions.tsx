import { CircleCheck, Pencil, X } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { setListingStatus } from "@/lib/actions/listings";

export function OwnerActions({ listingId, compact = false }: { listingId: string; compact?: boolean }) {
  const size = compact ? "sm" : "md";
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
      <form action={setListingStatus}>
        <input type="hidden" name="listing_id" value={listingId} />
        <input type="hidden" name="status" value="matched" />
        <SubmitButton variant="success" size={size} className="w-full" pendingText="…">
          <CircleCheck className="size-5" aria-hidden />
          Eşleştim
        </SubmitButton>
      </form>
      <form action={setListingStatus}>
        <input type="hidden" name="listing_id" value={listingId} />
        <input type="hidden" name="status" value="closed" />
        <SubmitButton variant="secondary" size={size} className="w-full" pendingText="…">
          <X className="size-5" aria-hidden />
          Kapat
        </SubmitButton>
      </form>
      <Link href={`/ilan/${listingId}/duzenle`} className={buttonClasses("ghost", size, "w-full border border-border")}>
        <Pencil className="size-5" aria-hidden />
        Düzenle
      </Link>
    </div>
  );
}
