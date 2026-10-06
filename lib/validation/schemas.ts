import { z } from "zod";
import { CITIES } from "@/lib/cities";
import { LISTING_TYPES, PLATFORMS, REPORT_REASONS } from "@/lib/labels";
import { normalizePhone } from "@/lib/phone";

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} en az ${min} karakter olmalı.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} en fazla ${max} karakter olabilir.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const phoneSchema = z
  .string()
  .transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Telefon 05xx xxx xx xx biçiminde, 11 haneli olmalı." });
      return z.NEVER;
    }
    return phone;
  });

const dormId = z.coerce.number({ error: "Yurt seçmelisin." }).int().positive("Yurt seçmelisin.");

export const fullNameSchema = text(3, 60, "Ad soyad").regex(/^[\p{L} .'-]+$/u, "Ad soyad sadece harf içerebilir.");

export const profileSchema = z.object({
  full_name: fullNameSchema,
  dorm_id: dormId,
  block: optionalText(30, "Blok / kat"),
  phone: phoneSchema,
  consent: z.literal("on", { error: "Devam etmek için açık rıza metnini onaylamalısın." }),
});

export const profileUpdateSchema = z.object({
  full_name: fullNameSchema,
  dorm_id: dormId,
  block: optionalText(30, "Blok / kat"),
});

export const phoneUpdateSchema = z.object({ phone: phoneSchema });

export const dormRequestSchema = z.object({
  city: z.enum(CITIES, { error: "İl seçmelisin." }),
  dorm_name: text(3, 150, "Yurt adı"),
});

export const phoneClaimSchema = z.object({
  phone: phoneSchema,
  note: optionalText(500, "Açıklama"),
});

const money = z.coerce
  .number({ error: "Tutar sayı olmalı." })
  .int("Tutarı tam TL olarak yaz.")
  .min(1, "Tutar en az 1 TL olmalı.")
  .max(10000, "Tutar en fazla 10.000 TL olabilir.");

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const listingSchema = z
  .object({
    type: z.enum(LISTING_TYPES, { error: "İlan türü seçmelisin." }),
    platform: z.enum(PLATFORMS, { error: "Platform seçmelisin." }),
    restaurant: text(2, 80, "Restoran"),
    description: optionalText(300, "Açıklama"),
    missing_amount: z.preprocess(emptyToUndefined, money.optional()),
    price_per_person: z.preprocess(emptyToUndefined, money.optional()),
    people_needed: z.coerce.number().int().min(1, "En az 1 kişi.").max(5, "En fazla 5 kişi."),
  })
  .superRefine((v, ctx) => {
    if (v.type === "min_basket" && v.missing_amount === undefined) {
      ctx.addIssue({ code: "custom", path: ["missing_amount"], message: "Eksik tutarı yazmalısın." });
    }
  });

export const reportSchema = z.object({
  listing_id: z.uuid("Geçersiz ilan."),
  reason: z.enum(REPORT_REASONS, { error: "Şikayet nedenini seç." }),
  note: optionalText(500, "Not"),
});

export const uuidSchema = z.uuid();

/** Zod hatalarını { alan: ilk mesaj } biçimine çevirir. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
