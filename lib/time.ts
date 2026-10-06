// Saatler veritabanında UTC, arayüzde Europe/Istanbul.
export const TIME_ZONE = "Europe/Istanbul";

const timeFormatter = new Intl.DateTimeFormat("tr-TR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** "az önce" / "5 dk önce" / "2 sa önce" / tarih */
export function formatAgo(iso: string, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} sa önce`;
  return formatDateTime(iso);
}

/** "18 dk kaldı" / "2 sa 5 dk kaldı" / "1 dk'dan az kaldı" / "süresi doldu" */
export function formatRemaining(iso: string, now = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return "süresi doldu";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "1 dk'dan az kaldı";
  if (minutes < 60) return `${minutes} dk kaldı`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} sa kaldı` : `${h} sa ${m} dk kaldı`;
}

/** Geri sayım: "14:59" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PHONE_CHANGE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

/** Numara 30 günde bir değişebilir: bir sonraki değişiklik zamanı (henüz gelmediyse), yoksa null. */
export function nextPhoneChangeAt(changedAt: string | null, now = new Date()): string | null {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + PHONE_CHANGE_INTERVAL_MS);
  return next > now ? formatDateTime(next.toISOString()) : null;
}
