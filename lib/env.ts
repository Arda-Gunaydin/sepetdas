function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} ortam değişkeni tanımlı değil (.env.local).`);
  }
  return value;
}

// NEXT_PUBLIC_ değişkenleri derleme sırasında koda gömülür; bu yüzden tek tek yazılmalı.
export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
