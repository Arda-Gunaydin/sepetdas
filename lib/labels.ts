import type { Enums } from "@/lib/supabase/database.types";

export const LISTING_TYPES = ["min_basket", "shared_menu", "delivery_fee"] as const satisfies readonly Enums<"listing_type">[];
export const PLATFORMS = ["yemeksepeti", "getir", "trendyol", "migros", "phone_order", "other"] as const satisfies readonly Enums<"listing_platform">[];
export const REPORT_REASONS = ["wrong_number", "not_their_number", "spam", "inappropriate", "other"] as const satisfies readonly Enums<"report_reason">[];

export const LISTING_TYPE_LABELS: Record<Enums<"listing_type">, string> = {
  min_basket: "Sepet tamamlama",
  shared_menu: "Menü / kampanya paylaşma",
  delivery_fee: "Teslimat ücreti bölüşme",
};

export const LISTING_TYPE_HINTS: Record<Enums<"listing_type">, string> = {
  min_basket: "Minimum sepet tutarına biraz eksiğin var",
  shared_menu: "2'li menü ya da kampanyayı birlikte alalım",
  delivery_fee: "Aynı yerden sipariş verip teslimatı bölüşelim",
};

export const PLATFORM_LABELS: Record<Enums<"listing_platform">, string> = {
  yemeksepeti: "Yemeksepeti",
  getir: "Getir",
  trendyol: "Trendyol Yemek",
  migros: "Migros Yemek",
  phone_order: "Telefonla sipariş",
  other: "Diğer",
};

export const LISTING_STATUS_LABELS: Record<Enums<"listing_status">, string> = {
  active: "Aktif",
  matched: "Eşleşti",
  closed: "Kapatıldı",
  hidden: "Gizlendi",
};

export const REPORT_REASON_LABELS: Record<Enums<"report_reason">, string> = {
  wrong_number: "Numara yanlış / ulaşılamıyor",
  not_their_number: "Numara bu kişiye ait değil",
  spam: "Spam / sahte ilan",
  inappropriate: "Uygunsuz içerik veya davranış",
  other: "Diğer",
};

export const PROFILE_STATUS_LABELS: Record<Enums<"profile_status">, string> = {
  active: "Aktif",
  suspended: "Askıda",
  banned: "Engelli",
};

export function formatTL(amount: number): string {
  return `${amount.toLocaleString("tr-TR")} TL`;
}

/** "Ayşe Yılmaz" → "Ayşe Y." */
export function firstNameWithInitial(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(" ")} ${last.charAt(0).toLocaleUpperCase("tr")}.`;
}
