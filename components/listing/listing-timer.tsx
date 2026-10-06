"use client";

import { Clock, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { extendListing } from "@/lib/actions/listings";
import { EXTEND_WINDOW_MIN, LISTING_LIFETIME_MIN } from "@/lib/listings";
import { formatCountdown } from "@/lib/time";

type Props = { listingId: string; expiresAt: string; isOwner: boolean; compact?: boolean };

const EXTEND_WINDOW_MS = EXTEND_WINDOW_MIN * 60 * 1000;

/** Kalan süre geri sayımı. İlan sahibi son 2 dakikada +15 dk ekleyebilir. */
export function ListingTimer({ listingId, expiresAt: initialExpiresAt, isOwner, compact = false }: Props) {
  const router = useRouter();
  // Uzatma sonrası sunucudan yeni değer gelene kadar yerel olarak daha geç olanı kullan.
  const [extendedTo, setExtendedTo] = useState<string | null>(null);
  const expiresAt = extendedTo && extendedTo > initialExpiresAt ? extendedTo : initialExpiresAt;
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Sunucu ve istemci saati farklı olacağı için geri sayım sadece istemcide başlar.
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now === null ? null : new Date(expiresAt).getTime() - now;
  const expired = left !== null && left <= 0;
  const canExtend = isOwner && left !== null && left > 0 && left <= EXTEND_WINDOW_MS;

  useEffect(() => {
    // Süre dolunca sunucudan taze sayfa: ilan artık görünmez.
    if (expired) router.refresh();
  }, [expired, router]);

  const tone = expired
    ? "bg-muted text-muted-foreground"
    : canExtend
      ? "bg-warning-soft text-warning-soft-foreground"
      : "bg-primary-soft text-primary-soft-foreground";

  return (
    <div className={`flex flex-col gap-2 rounded-xl p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          <Clock className="size-5" aria-hidden />
          {expired ? "Süresi doldu" : "Kalan süre"}
        </span>
        <span className="text-xl font-extrabold tabular-nums" aria-live="off">
          {left === null ? "–:––" : formatCountdown(left)}
        </span>
      </div>

      {isOwner && !expired ? (
        <>
          <button
            type="button"
            disabled={!canExtend || pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await extendListing(listingId);
                if ("expiresAt" in result) setExtendedTo(result.expiresAt);
                else setError(result.error);
              })
            }
            className={buttonClasses(canExtend ? "primary" : "secondary", compact ? "sm" : "md", "w-full")}
          >
            <TimerReset className="size-5" aria-hidden />
            {pending ? "Uzatılıyor…" : `+${LISTING_LIFETIME_MIN} dk ekle`}
          </button>
          <p className="text-sm" role={canExtend ? "status" : undefined}>
            {canExtend
              ? `Süre bitmek üzere! Uzatmazsan ilan kaldırılacak.`
              : `Son ${EXTEND_WINDOW_MIN} dakikada +${LISTING_LIFETIME_MIN} dk ekleyebilirsin. Uzatmazsan ilan kaldırılır.`}
          </p>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
