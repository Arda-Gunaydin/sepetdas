"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { dbErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/schemas";
import { formValues, type FormState } from "./state";

// Asıl yetki kontrolü veritabanındaki admin_* fonksiyonlarında (is_admin()). Burada sadece erken çıkış.
async function adminClient() {
  const profile = await requireProfile();
  if (!profile.is_admin) throw new Error("Yetkisiz");
  return createClient();
}

const id = z.coerce.number().int().positive();

export async function setUserStatus(formData: FormData): Promise<void> {
  const parsed = z
    .object({ user_id: z.uuid(), status: z.enum(["active", "suspended", "banned"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_set_user_status", { p_user_id: parsed.data.user_id, p_status: parsed.data.status });
  revalidatePath("/admin", "layout");
}

export async function resolveReport(formData: FormData): Promise<void> {
  const parsed = id.safeParse(formData.get("report_id"));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_resolve_report", { p_report_id: parsed.data });
  revalidatePath("/admin", "layout");
}

export async function reviewDormRequest(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      request_id: id,
      decision: z.enum(["approve", "reject"]),
      city: z.string().trim().max(40).optional(),
      name: z.string().trim().max(150).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_review_dorm_request", {
    p_request_id: parsed.data.request_id,
    p_approve: parsed.data.decision === "approve",
    p_city: parsed.data.city,
    p_name: parsed.data.name,
  });
  revalidatePath("/admin", "layout");
}

export async function resolvePhoneClaim(formData: FormData): Promise<void> {
  const parsed = id.safeParse(formData.get("claim_id"));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_resolve_phone_claim", { p_claim_id: parsed.data });
  revalidatePath("/admin", "layout");
}

const dormSchema = z.object({
  id: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable()),
  city: z.enum(CITIES, { error: "İl seçmelisin." }),
  name: z
    .string()
    .trim()
    .min(3, "Yurt adı en az 3 karakter olmalı.")
    .max(150, "Yurt adı en fazla 150 karakter olabilir."),
});

/** Yurt ekle (id boş) veya düzenle. */
export async function saveDorm(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = dormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_save_dorm", {
    p_id: parsed.data.id,
    p_city: parsed.data.city,
    p_name: parsed.data.name,
  });
  if (error) return { error: dbErrorMessage(error), values };
  revalidatePath("/admin", "layout");
  return parsed.data.id
    ? { ok: true, message: "Yurt güncellendi." }
    : { ok: true, message: `“${parsed.data.name}” eklendi.` };
}

export async function setDormActive(formData: FormData): Promise<void> {
  const parsed = z
    .object({ dorm_id: id, active: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_set_dorm_active", { p_id: parsed.data.dorm_id, p_active: parsed.data.active === "true" });
  revalidatePath("/admin", "layout");
}

export async function deleteDorm(formData: FormData): Promise<void> {
  const parsed = id.safeParse(formData.get("dorm_id"));
  if (!parsed.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_delete_dorm", { p_id: parsed.data });
  revalidatePath("/admin", "layout");
}
