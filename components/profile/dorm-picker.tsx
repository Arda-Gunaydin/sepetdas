"use client";

import { useMemo, useState } from "react";
import { Field, Select } from "@/components/ui/field";
import { compareTr } from "@/lib/cities";
import { CityOptions } from "./city-options";

export type DormOption = { id: number; city: string; name: string };

type Props = {
  dorms: DormOption[];
  defaultDormId?: number | string;
  error?: string;
  onDormChange?: (dormId: string) => void;
};

/** İl → yurt seçimi. Yurt listesi seçilen ile göre süzülür. */
export function DormPicker({ dorms, defaultDormId, error, onDormChange }: Props) {
  const initialDorm = dorms.find((d) => String(d.id) === String(defaultDormId ?? ""));
  const [city, setCity] = useState(initialDorm?.city ?? "");
  const [dormId, setDormId] = useState(initialDorm ? String(initialDorm.id) : "");

  const cityDorms = useMemo(
    () => dorms.filter((d) => d.city === city).sort((a, b) => compareTr(a.name, b.name)),
    [dorms, city],
  );

  return (
    <>
      <Field id="city" label="İl">
        <Select
          id="city"
          name="city_filter"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setDormId("");
            onDormChange?.("");
          }}
          required
        >
          <option value="" disabled>
            İl seç
          </option>
          <CityOptions />
        </Select>
      </Field>

      <Field
        id="dorm_id"
        label="Yurt"
        error={error}
        hint={city && cityDorms.length === 0 ? "Bu ilde listemizde yurt yok. Aşağıdan talep gönderebilirsin." : undefined}
      >
        <Select
          id="dorm_id"
          value={dormId}
          onChange={(e) => {
            setDormId(e.target.value);
            onDormChange?.(e.target.value);
          }}
          disabled={!city || cityDorms.length === 0}
          error={error}
          hasHint={Boolean(city && cityDorms.length === 0)}
          required
        >
          <option value="" disabled>
            {city ? "Yurt seç" : "Önce il seç"}
          </option>
          {cityDorms.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
