"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";

/** "05xx xxx xx xx" maskesiyle telefon girişi. Sunucu yine de kendi doğrulamasını yapar. */
function mask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean).join(" ");
}

export function PhoneInput({ defaultValue = "", error, hasHint }: { defaultValue?: string; error?: string; hasHint?: boolean }) {
  const [value, setValue] = useState(mask(defaultValue));
  return (
    <Input
      id="phone"
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder="05xx xxx xx xx"
      value={value}
      onChange={(e) => setValue(mask(e.target.value))}
      error={error}
      hasHint={hasHint}
      required
    />
  );
}
