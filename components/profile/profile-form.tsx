"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeProfile } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";
import { DormPicker, type DormOption } from "./dorm-picker";
import { PhoneClaimForm } from "./phone-claim-form";
import { PhoneInput } from "./phone-input";

export function ProfileForm({ dorms, defaultName }: { dorms: DormOption[]; defaultName?: string }) {
  const [state, action] = useActionState(completeProfile, initialState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-5" noValidate>
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}

        <Field id="full_name" label="Ad soyad" error={e.full_name}>
          <Input
            id="full_name"
            autoComplete="name"
            defaultValue={v.full_name ?? defaultName}
            maxLength={60}
            error={e.full_name}
            required
          />
        </Field>

        <DormPicker dorms={dorms} defaultDormId={v.dorm_id} error={e.dorm_id} />

        <Field
          id="phone"
          label="Telefon"
          hint="Numaran ilanlarda yazmaz; sadece yurt arkadaşların “Numarayı göster” dediğinde açılır."
          error={e.phone}
        >
          <PhoneInput defaultValue={v.phone} error={e.phone} hasHint />
        </Field>

        <Field id="block" label="Blok / kat" optional error={e.block}>
          <Input id="block" defaultValue={v.block} placeholder="Ör. B Blok 3. kat" maxLength={30} error={e.block} />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-surface p-3">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primary"
              aria-invalid={e.consent ? true : undefined}
              aria-describedby={e.consent ? "consent-error" : undefined}
              defaultChecked={v.consent === "on"}
              required
            />
            <span className="text-sm">
              <Link href="/kvkk" target="_blank" className="font-semibold text-accent underline underline-offset-2">
                Aydınlatma metnini
              </Link>{" "}
              okudum. Ad soyadımın ve yurdumun aynı yurttaki kullanıcılara gösterilmesine, telefon numaramın
              ilanlarımda &quot;Numarayı göster&quot; diyen yurt arkadaşlarıma açılmasına açık rıza veriyorum.
            </span>
          </label>
          {e.consent ? (
            <p id="consent-error" role="alert" className="text-sm font-medium text-destructive">
              {e.consent}
            </p>
          ) : null}
        </div>

        <SubmitButton size="lg" pendingText="Kaydediliyor…">
          Kaydı tamamla
        </SubmitButton>
      </form>

      {state.phoneTaken && state.phone ? <PhoneClaimForm phone={state.phone} /> : null}
    </div>
  );
}
