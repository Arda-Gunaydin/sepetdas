import type { Tables } from "@/lib/supabase/database.types";

/** İlan ömrü ve uzatma kuralları (asıl kontrol veritabanında: listings_before_write, extend_listing). */
export const LISTING_LIFETIME_MIN = 15;
export const EXTEND_WINDOW_MIN = 2;

// İlan sorgularında seçilecek sütunlar. Telefon numarası BURADA YOK ve olmamalı (CLAUDE.md §7.1).
export const LISTING_COLUMNS =
  "id, owner_id, dorm_id, type, platform, restaurant, description, missing_amount, price_per_person, people_needed, expires_at, status, created_at, owner:profiles!listings_owner_id_fkey(full_name, block)" as const;

export type ListingWithOwner = Pick<
  Tables<"listings">,
  | "id"
  | "owner_id"
  | "dorm_id"
  | "type"
  | "platform"
  | "restaurant"
  | "description"
  | "missing_amount"
  | "price_per_person"
  | "people_needed"
  | "expires_at"
  | "status"
  | "created_at"
> & { owner: Pick<Tables<"profiles">, "full_name" | "block"> | null };

export function isListingLive(listing: Pick<Tables<"listings">, "status" | "expires_at">, now = new Date()): boolean {
  return listing.status === "active" && new Date(listing.expires_at) > now;
}
