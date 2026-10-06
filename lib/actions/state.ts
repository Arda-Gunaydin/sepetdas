export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Hata sonrası formu yeniden doldurmak için gönderilen değerler. */
  values?: Record<string, string>;
  phoneTaken?: boolean;
  phone?: string;
};

export const initialState: FormState = {};

export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}
