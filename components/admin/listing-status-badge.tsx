import { Badge } from "@/components/ui/badge";
import { LISTING_STATUS_LABELS } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";

/** Yönetici görünümü: "aktif" ama süresi geçmiş ilan "Süresi doldu" görünür. */
export function ListingStatusBadge({ status, expiresAt, nowIso }: { status: Enums<"listing_status">; expiresAt: string; nowIso: string }) {
  if (status === "active" && expiresAt <= nowIso) return <Badge tone="neutral">Süresi doldu</Badge>;
  if (status === "active") return <Badge tone="success">Aktif</Badge>;
  if (status === "matched") return <Badge tone="accent">{LISTING_STATUS_LABELS.matched}</Badge>;
  if (status === "hidden") return <Badge tone="danger">{LISTING_STATUS_LABELS.hidden}</Badge>;
  return <Badge tone="neutral">{LISTING_STATUS_LABELS.closed}</Badge>;
}
