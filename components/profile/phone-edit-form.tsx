"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePhone } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";
import { formatPhone } from "@/lib/phone";
import { PhoneClaimForm } from "./phone-claim-form";
import { PhoneInput } from "./phone-input";

export function PhoneEditForm({ phone, nextChangeAt }: { phone: string; nextChangeAt: string | null }) {
  const [state, action] = useActionState(updatePhone, initialState);
  const e = state.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-col gap-4" noValidate>
        {state.ok ? <Notice tone="success">{state.message}</Notice> : null}
        <Field
          id="phone"
          label="Telefon"
          error={e.phone}
          hint={nextChangeAt ? `Numaranı ${nextChangeAt} tarihinden sonra değiştirebilirsin.` : "Numara 30 günde en fazla bir kez değiştirilebilir."}
        >
          <PhoneInput key={phone} defaultValue={state.values?.phone ?? formatPhone(phone)} error={e.phone} hasHint />
        </Field>
        <SubmitButton variant="secondary" pendingText="Kaydediliyor…" disabled={Boolean(nextChangeAt)}>
          Numarayı güncelle
        </SubmitButton>
      </form>
      {state.phoneTaken && state.phone ? <PhoneClaimForm phone={state.phone} /> : null}
    </div>
  );
}
