"use client";

import { useActionState, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialState, type FormState } from "@/lib/actions/state";
import { LISTING_TYPE_HINTS, LISTING_TYPE_LABELS, LISTING_TYPES, PLATFORM_LABELS, PLATFORMS } from "@/lib/labels";
import { EXTEND_WINDOW_MIN, LISTING_LIFETIME_MIN } from "@/lib/listings";
import type { Enums } from "@/lib/supabase/database.types";
import { ListingTypeIcon } from "./type-icon";

export type ListingFormDefaults = {
  type?: Enums<"listing_type">;
  platform?: Enums<"listing_platform">;
  restaurant?: string;
  description?: string;
  missing_amount?: string;
  price_per_person?: string;
  people_needed?: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: ListingFormDefaults;
  submitLabel: string;
};

export function ListingForm({ action, defaults, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const v = { ...defaults, ...(state.values ?? {}) } as Record<string, string | undefined>;
  const e = state.fieldErrors ?? {};
  const [type, setType] = useState<Enums<"listing_type">>((v.type as Enums<"listing_type">) ?? "min_basket");

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Ne arıyorsun?</legend>
        {LISTING_TYPES.map((t) => (
          <label
            key={t}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-surface p-3 transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring ${
              type === t ? "border-primary bg-primary-soft/50" : "border-border hover:border-input/50"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="sr-only"
            />
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                type === t ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
              }`}
            >
              <ListingTypeIcon type={t} />
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{LISTING_TYPE_LABELS[t]}</span>
              <span className="text-sm text-muted-foreground">{LISTING_TYPE_HINTS[t]}</span>
            </span>
          </label>
        ))}
        {e.type ? <p role="alert" className="text-sm font-medium text-destructive">{e.type}</p> : null}
      </fieldset>

      <Field id="restaurant" label="Restoran" error={e.restaurant}>
        <Input id="restaurant" defaultValue={v.restaurant} placeholder="Restoranın adı" maxLength={80} error={e.restaurant} required />
      </Field>

      <Field id="platform" label="Nereden sipariş vereceksin?" error={e.platform}>
        <Select id="platform" defaultValue={v.platform ?? "yemeksepeti"} error={e.platform} required>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </Select>
      </Field>

      {type === "min_basket" ? (
        <Field id="missing_amount" label="Eksik tutar (TL)" hint="Minimum sepete ne kadar kaldı?" error={e.missing_amount}>
          <Input
            id="missing_amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            step={1}
            defaultValue={v.missing_amount}
            placeholder="Ör. 50"
            error={e.missing_amount}
            hasHint
            required
          />
        </Field>
      ) : null}

      {type === "shared_menu" ? (
        <Field id="price_per_person" label="Kişi başı fiyat (TL)" optional hint="Paylaşınca kişi başı ne tutuyor?" error={e.price_per_person}>
          <Input
            id="price_per_person"
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            step={1}
            defaultValue={v.price_per_person}
            placeholder="Ör. 300"
            error={e.price_per_person}
            hasHint
          />
        </Field>
      ) : null}

      <Field id="description" label="Ne söyleyeceksin?" optional error={e.description}>
        <Textarea
          id="description"
          defaultValue={v.description}
          placeholder="Ör. Tavuk dürüm menü söyleyeceğim, yanına bir şey ekleyen olursa sepet tamam."
          maxLength={300}
          rows={3}
          error={e.description}
        />
      </Field>

      <Field id="people_needed" label="Kaç kişi lazım?" error={e.people_needed}>
        <Select id="people_needed" defaultValue={v.people_needed ?? "1"} error={e.people_needed}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} kişi
            </option>
          ))}
        </Select>
      </Field>

      <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent-soft-foreground">
        İlan {LISTING_LIFETIME_MIN} dakika panoda kalır. Son {EXTEND_WINDOW_MIN} dakikada &quot;+{LISTING_LIFETIME_MIN} dk ekle&quot;
        butonuyla uzatabilirsin; uzatmazsan ilan kaldırılır.
      </p>

      <SubmitButton size="lg" pendingText="Kaydediliyor…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
