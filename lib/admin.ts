import { notFound } from "next/navigation";
import { requireProfile, type CurrentProfile } from "@/lib/auth";

/** Yönetici değilse 404. Asıl yetki kontrolü veritabanında (RLS / admin_* fonksiyonları). */
export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!profile.is_admin) notFound();
  return profile;
}

/** İstanbul'a göre bugünün başlangıcı (UTC ISO). Türkiye 2016'dan beri sabit UTC+3. */
export function istanbulDayStartIso(now = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(now);
  return new Date(`${day}T00:00:00+03:00`).toISOString();
}

/** Son görülmesi bu kadar yeni olan kullanıcı "çevrim içi" sayılır (sinyal dakikada bir gelir). */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

/** Çevrim içi eşiği (UTC ISO): last_seen_at bundan sonraysa çevrim içi. */
export function onlineSinceIso(now = new Date()): string {
  return new Date(now.getTime() - ONLINE_WINDOW_MS).toISOString();
}

export function isOnline(lastSeenAt: string | null | undefined, now = new Date()): boolean {
  return !!lastSeenAt && new Date(lastSeenAt).getTime() > now.getTime() - ONLINE_WINDOW_MS;
}

/** PostgREST ilike filtresi için kullanıcı girdisini kaçışlar. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_,()]/g, (c) => `\\${c}`)}%`;
}
