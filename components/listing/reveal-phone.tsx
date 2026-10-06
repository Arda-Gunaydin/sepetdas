"use client";

import { Eye, MessageCircle, Phone } from "lucide-react";
import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { revealPhone } from "@/lib/actions/listings";
import { formatPhone, telLink, whatsappLink } from "@/lib/phone";

type Props = { listingId: string; restaurant: string; ownerFirstName: string };

export function RevealPhone({ listingId, restaurant, ownerFirstName }: Props) {
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (phone) {
    const message = `Merhaba ${ownerFirstName}, Sepetdaş'taki "${restaurant}" ilanın için yazıyorum. Hâlâ geçerli mi?`;
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <p className="text-center text-2xl font-extrabold tracking-wide tabular-nums">{formatPhone(phone)}</p>
        <div className="grid grid-cols-2 gap-3">
          <a href={telLink(phone)} className={buttonClasses("accent", "lg")}>
            <Phone className="size-5" aria-hidden />
            Ara
          </a>
          <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" className={buttonClasses("success", "lg")}>
            <MessageCircle className="size-5" aria-hidden />
            WhatsApp&apos;tan yaz
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await revealPhone(listingId);
            if ("phone" in result) setPhone(result.phone);
            else setError(result.error);
          })
        }
        className={buttonClasses("primary", "lg", "w-full")}
      >
        <Eye className="size-5" aria-hidden />
        {pending ? "Açılıyor…" : "Numarayı göster"}
      </button>
      <p className="text-center text-sm text-muted-foreground">Numarayı kimin açtığı kaydedilir. Günde en fazla 20 ilan.</p>
    </div>
  );
}
