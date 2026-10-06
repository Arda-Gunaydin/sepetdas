"use client";

import { useActionState } from "react";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { claimPhone } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";
import { formatPhone } from "@/lib/phone";

/** "Bu numara başka hesapta kayıtlı" durumunda yöneticiye talep gönderir. */
export function PhoneClaimForm({ phone }: { phone: string }) {
  const [state, action] = useActionState(claimPhone, initialState);
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl bg-warning-soft p-3 text-warning-soft-foreground">
      <p className="text-sm">
        <strong>{formatPhone(phone)}</strong> numarası sana aitse yöneticiye bildir; inceleyip düzeltelim.
      </p>
      <input type="hidden" name="phone" value={phone} />
      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
      <SubmitButton variant="secondary" size="sm" pendingText="Gönderiliyor…">
        Numara bana ait, bildir
      </SubmitButton>
    </form>
  );
}
