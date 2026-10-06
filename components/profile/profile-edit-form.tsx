"use client";

import { useActionState, useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfile } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";
import { DormPicker, type DormOption } from "./dorm-picker";

type Props = { dorms: DormOption[]; fullName: string; dormId: number; block: string | null };

export function ProfileEditForm({ dorms, fullName, dormId, block }: Props) {
  const [state, action] = useActionState(updateProfile, initialState);
  const [selectedDorm, setSelectedDorm] = useState(String(dormId));
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const dormChanged = selectedDorm !== "" && selectedDorm !== String(dormId);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.ok ? <Notice tone="success">{state.message}</Notice> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="full_name" label="Ad soyad" error={e.full_name}>
        <Input id="full_name" defaultValue={v.full_name ?? fullName} maxLength={60} autoComplete="name" error={e.full_name} required />
      </Field>
      <DormPicker dorms={dorms} defaultDormId={v.dorm_id ?? dormId} error={e.dorm_id} onDormChange={setSelectedDorm} />
      {dormChanged ? <Notice tone="warning">Yurdunu değiştirirsen açık ilanların kapanır.</Notice> : null}
      <Field id="block" label="Blok / kat" optional error={e.block}>
        <Input id="block" defaultValue={v.block ?? block ?? ""} maxLength={30} error={e.block} />
      </Field>
      <SubmitButton pendingText="Kaydediliyor…">Kaydet</SubmitButton>
    </form>
  );
}
