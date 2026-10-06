"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestDorm } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";
import { CityOptions } from "./city-options";

export function DormRequestForm() {
  const [state, action] = useActionState(requestDorm, initialState);

  if (state.ok) return <Notice tone="success">{state.message}</Notice>;

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="req_city" label="İl" error={state.fieldErrors?.city}>
        <Select id="req_city" name="city" defaultValue={state.values?.city ?? ""} error={state.fieldErrors?.city} required>
          <option value="" disabled>
            İl seç
          </option>
          <CityOptions />
        </Select>
      </Field>
      <Field id="req_dorm_name" label="Yurdun adı" error={state.fieldErrors?.dorm_name}>
        <Input
          id="req_dorm_name"
          name="dorm_name"
          defaultValue={state.values?.dorm_name}
          placeholder="Yurdunun tam adı"
          maxLength={150}
          error={state.fieldErrors?.dorm_name}
          required
        />
      </Field>
      <SubmitButton variant="secondary" pendingText="Gönderiliyor…">
        Talep gönder
      </SubmitButton>
    </form>
  );
}
