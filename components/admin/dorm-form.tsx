"use client";

import { useActionState } from "react";
import { CityOptions } from "@/components/profile/city-options";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveDorm } from "@/lib/actions/admin";
import { initialState } from "@/lib/actions/state";

type Props = { dorm?: { id: number; city: string; name: string } };

/** Yurt ekleme (dorm yoksa) veya düzenleme formu. */
export function DormForm({ dorm }: Props) {
  const [state, action] = useActionState(saveDorm, initialState);
  const v = state.ok && !dorm ? {} : (state.values ?? {});
  const e = state.fieldErrors ?? {};
  const prefix = dorm ? `dorm-${dorm.id}` : "new-dorm";

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      {state.ok ? <Notice tone="success">{state.message}</Notice> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {dorm ? <input type="hidden" name="id" value={dorm.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end">
        <Field id={`${prefix}-city`} label="İl" error={e.city}>
          <Select
            id={`${prefix}-city`}
            name="city"
            key={state.ok ? "reset" : "keep"}
            defaultValue={v.city ?? dorm?.city ?? ""}
            error={e.city}
            required
          >
            <option value="" disabled>
              İl seç
            </option>
            <CityOptions />
          </Select>
        </Field>
        <Field id={`${prefix}-name`} label="Yurt adı" error={e.name}>
          <Input
            id={`${prefix}-name`}
            name="name"
            key={state.ok ? "reset" : "keep"}
            defaultValue={v.name ?? dorm?.name ?? ""}
            placeholder="Ör. Muratpaşa Öğrenci Yurdu"
            maxLength={150}
            error={e.name}
            required
          />
        </Field>
        <SubmitButton pendingText="Kaydediliyor…" className="sm:mb-0">
          {dorm ? "Kaydet" : "Yurt ekle"}
        </SubmitButton>
      </div>
    </form>
  );
}
