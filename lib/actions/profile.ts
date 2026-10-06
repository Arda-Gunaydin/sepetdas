"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { dbErrorMessage, isPhoneTaken, PHONE_TAKEN } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  dormRequestSchema,
  fieldErrors,
  phoneClaimSchema,
  phoneUpdateSchema,
  profileSchema,
  profileUpdateSchema,
} from "@/lib/validation/schemas";
import { formValues, type FormState } from "./state";

async function userIdOrRedirect(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/");
  return id;
}

export async function completeProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  await userIdOrRedirect();
  const values = formValues(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_profile", {
    p_full_name: parsed.data.full_name,
    p_dorm_id: parsed.data.dorm_id,
    p_block: parsed.data.block ?? "",
    p_phone: parsed.data.phone,
    p_consent: true,
  });

  if (error) {
    if (isPhoneTaken(error)) {
      return { values, phoneTaken: true, phone: parsed.data.phone, fieldErrors: { phone: PHONE_TAKEN } };
    }
    // Profil zaten varsa (ör. iki sekmeden gönderildi) panoya devam.
    if (error.code === "23505" && error.message.includes("profiles_pkey")) redirect("/pano");
    return { error: dbErrorMessage(error), values };
  }

  redirect("/pano");
}

export async function requestDorm(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await userIdOrRedirect();
  const values = formValues(formData);
  const parsed = dormRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("dorm_requests").insert({ user_id: userId, ...parsed.data });
  if (error) return { error: dbErrorMessage(error), values };

  return { ok: true, message: "Talebin alındı. Yönetici onaylayınca yurdun listede görünecek." };
}

export async function claimPhone(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await userIdOrRedirect();
  const parsed = phoneClaimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: Object.values(fieldErrors(parsed.error))[0] };

  const supabase = await createClient();
  const { error } = await supabase.from("phone_claims").insert({ user_id: userId, ...parsed.data });
  if (error && error.code !== "23505") return { error: dbErrorMessage(error) };

  return { ok: true, message: "Bildirimin yöneticiye iletildi. İnceleme sonrası seninle iletişime geçilecek." };
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await userIdOrRedirect();
  const values = formValues(formData);
  const parsed = profileUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: dbErrorMessage(error), values };

  revalidatePath("/", "layout");
  return { ok: true, message: "Bilgilerin güncellendi.", values };
}

export async function updatePhone(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await userIdOrRedirect();
  const values = formValues(formData);
  const parsed = phoneUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_private")
    .update({ phone: parsed.data.phone })
    .eq("user_id", userId)
    .select("phone")
    .maybeSingle();

  if (error) {
    if (isPhoneTaken(error)) {
      return { values, phoneTaken: true, phone: parsed.data.phone, fieldErrors: { phone: PHONE_TAKEN } };
    }
    return { fieldErrors: { phone: dbErrorMessage(error) }, values };
  }
  if (!data) return { error: "Numara güncellenemedi.", values };

  revalidatePath("/profil");
  return { ok: true, message: "Telefon numaran güncellendi." };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  await userIdOrRedirect();
  if (formData.get("confirm") !== "on") {
    return { fieldErrors: { confirm: "Silmek için kutuyu işaretlemelisin." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: dbErrorMessage(error) };

  await supabase.auth.signOut();
  redirect("/?silindi=1");
}
