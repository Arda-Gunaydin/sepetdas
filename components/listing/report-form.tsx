"use client";

import { useActionState } from "react";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { reportListing } from "@/lib/actions/listings";
import { initialState } from "@/lib/actions/state";
import { REPORT_REASON_LABELS, REPORT_REASONS } from "@/lib/labels";

export function ReportForm({ listingId }: { listingId: string }) {
  const [state, action] = useActionState(reportListing, initialState);
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="listing_id" value={listingId} />
      <Field id="reason" label="Neden?" error={e.reason}>
        <Select id="reason" defaultValue={state.values?.reason ?? ""} error={e.reason} required>
          <option value="" disabled>
            Bir neden seç
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {REPORT_REASON_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="note" label="Not" optional error={e.note}>
        <Textarea id="note" defaultValue={state.values?.note} maxLength={500} rows={3} error={e.note} />
      </Field>
      <SubmitButton variant="danger" pendingText="Gönderiliyor…">
        Şikayet et
      </SubmitButton>
    </form>
  );
}
