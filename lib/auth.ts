import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CurrentProfile = Pick<Tables<"profiles">, "id" | "full_name" | "dorm_id" | "block" | "status" | "is_admin"> & {
  dorm: Pick<Tables<"dorms">, "id" | "city" | "name"> | null;
};

/** Oturumdaki kullanıcının id'si (JWT doğrulanarak). Aynı istek içinde tek kez hesaplanır. */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
});

export const getProfile = cache(async (): Promise<CurrentProfile | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, dorm_id, block, status, is_admin, dorm:dorms(id, city, name)")
    .eq("id", userId)
    .maybeSingle();
  return data;
});

/** Giriş yapılmamışsa ana sayfaya, profil eksikse /kayit'a yönlendirir. */
export async function requireProfile(): Promise<CurrentProfile> {
  const userId = await getUserId();
  if (!userId) redirect("/");
  const profile = await getProfile();
  if (!profile) redirect("/kayit");
  return profile;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/");
  return userId;
}
