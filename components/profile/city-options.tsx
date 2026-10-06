import { OTHER_CITIES, PRIORITY_CITIES } from "@/lib/cities";

/** İl seçeneği listesi: İstanbul ve Ankara üstte, diğerleri alfabetik. */
export function CityOptions() {
  return (
    <>
      <optgroup label="Büyükşehirler">
        {PRIORITY_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </optgroup>
      <optgroup label="Diğer iller">
        {OTHER_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </optgroup>
    </>
  );
}
