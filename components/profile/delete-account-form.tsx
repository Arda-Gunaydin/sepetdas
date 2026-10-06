"use client";

import { useActionState } from "react";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAccount } from "@/lib/actions/profile";
import { initialState } from "@/lib/actions/state";

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, initialState);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <p className="text-sm text-muted-foreground">
        Profilin, telefon numaran, ilanların, şikayet ve numara görüntüleme kayıtların kalıcı olarak silinir. Bu işlem geri alınamaz.
      </p>
      <label htmlFor="confirm" className="flex cursor-pointer items-start gap-3">
        <input
          id="confirm"
          name="confirm"
          type="checkbox"
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-destructive"
          aria-invalid={state.fieldErrors?.confirm ? true : undefined}
          aria-describedby={state.fieldErrors?.confirm ? "confirm-error" : undefined}
        />
        <span className="text-sm font-semibold">Hesabımın ve tüm verilerimin kalıcı olarak silineceğini anladım.</span>
      </label>
      {state.fieldErrors?.confirm ? (
        <p id="confirm-error" role="alert" className="text-sm font-medium text-destructive">
          {state.fieldErrors.confirm}
        </p>
      ) : null}
      <SubmitButton variant="danger" pendingText="Siliniyor…">
        Hesabımı ve verilerimi sil
      </SubmitButton>
    </form>
  );
}
