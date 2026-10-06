"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, listingSchema, reportSchema, uuidSchema } from "@/lib/validation/schemas";
import { formValues, type FormState } from "./state";

function parseListing(formData: FormData) {
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) } as const;
  return {
    data: {
      ...parsed.data,
      missing_amount: parsed.data.missing_amount ?? null,
      price_per_person: parsed.data.price_per_person ?? null,
    },
  } as const;
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const values = formValues(formData);
  const parsed = parseListing(formData);
  if ("errors" in parsed) return { fieldErrors: parsed.errors, values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...parsed.data, owner_id: profile.id, dorm_id: profile.dorm_id })
    .select("id")
    .single();
  if (error) return { error: dbErrorMessage(error), values };

  revalidatePath("/pano");
  revalidatePath("/ilanlarim");
  redirect(`/ilan/${data.id}?yeni=1`);
}

export async function updateListing(listingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  if (!uuidSchema.safeParse(listingId).success) return { error: "İlan bulunamadı." };
  const values = formValues(formData);
  const parsed = parseListing(formData);
  if ("errors" in parsed) return { fieldErrors: parsed.errors, values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update(parsed.data)
    .eq("id", listingId)
    .eq("owner_id", profile.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: dbErrorMessage(error), values };
  if (!data) return { error: "İlan bulunamadı veya süresi doldu.", values };

  revalidatePath("/pano");
  revalidatePath("/ilanlarim");
  redirect(`/ilan/${listingId}`);
}

/** İlan sahibinin "Eşleştim" / "İlanı kapat" işlemi. Kapanan ilan sahibine de görünmez olur. */
export async function setListingStatus(formData: FormData): Promise<void> {
  await requireProfile();
  const id = String(formData.get("listing_id") ?? "");
  const status = formData.get("status");
  if (!uuidSchema.safeParse(id).success || (status !== "matched" && status !== "closed")) return;

  const supabase = await createClient();
  await supabase.rpc("close_listing", { p_listing_id: id, p_status: status });

  revalidatePath("/pano");
  revalidatePath("/ilanlarim");
  redirect(`/ilanlarim?durum=${status === "matched" ? "eslesti" : "kapandi"}`);
}

export type ExtendResult = { expiresAt: string } | { error: string };

/** Son 2 dakikada +15 dk. Kural veritabanında (extend_listing). */
export async function extendListing(listingId: string): Promise<ExtendResult> {
  await requireProfile();
  if (!uuidSchema.safeParse(listingId).success) return { error: "İlan bulunamadı." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("extend_listing", { p_listing_id: listingId });
  if (error || !data) return { error: dbErrorMessage(error) };

  revalidatePath("/pano");
  revalidatePath("/ilanlarim");
  revalidatePath(`/ilan/${listingId}`);
  return { expiresAt: data };
}

export type RevealResult = { phone: string } | { error: string };

export async function revealPhone(listingId: string): Promise<RevealResult> {
  await requireProfile();
  if (!uuidSchema.safeParse(listingId).success) return { error: "İlan bulunamadı." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_phone", { p_listing_id: listingId });
  if (error || !data) return { error: dbErrorMessage(error) };
  return { phone: data };
}

export async function reportListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const values = formValues(formData);
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: profile.id,
    listing_id: parsed.data.listing_id,
    // Veritabanı bunu ilan sahibiyle değiştirir; istemciden gelen değere güvenilmez.
    reported_user_id: profile.id,
    reason: parsed.data.reason,
    note: parsed.data.note,
  });
  if (error) return { error: dbErrorMessage(error), values };

  return { ok: true, message: "Şikayetin alındı. Teşekkürler, yönetici inceleyecek." };
}
