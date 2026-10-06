// Veritabanından gelen makinece okunur hataları kullanıcıya gösterilecek Türkçe mesajlara çevirir.
const MESSAGES: Record<string, string> = {
  not_authenticated: "Oturumun kapanmış. Lütfen yeniden giriş yap.",
  profile_incomplete: "Önce profilini tamamlamalısın.",
  account_not_active: "Hesabın askıya alındığı için bu işlemi yapamazsın.",
  listing_not_found: "İlan bulunamadı.",
  listing_not_active: "Bu ilan artık aktif değil.",
  listing_not_editable: "Süresi dolmuş veya kapanmış ilan düzenlenemez.",
  own_listing: "Bu senin ilanın.",
  daily_reveal_limit: "Bugün en fazla 20 ilanın numarasını açabilirsin. Yarın tekrar dene.",
  active_listing_limit: "Aynı anda en fazla 2 aktif ilanın olabilir. Önce birini kapat.",
  wrong_dorm: "Sadece kendi yurduna ilan açabilirsin.",
  extend_too_early: "Süreyi sadece son 2 dakikada uzatabilirsin.",
  extend_limit: "Bir ilan en fazla 6 saat açık kalabilir. Gerekirse yeni ilan aç.",
  invalid_status: "Geçersiz işlem.",
  phone_change_too_soon: "Telefon numaranı 30 günde en fazla bir kez değiştirebilirsin.",
  dorm_not_found: "Seçtiğin yurt bulunamadı.",
  consent_required: "Devam etmek için açık rıza metnini onaylamalısın.",
  cannot_report_self: "Kendi ilanını şikayet edemezsin.",
  too_many_requests: "Bekleyen çok fazla talebin var. Yönetici incelemesini bekle.",
  not_admin: "Bu işlem için yetkin yok.",
  cannot_change_self: "Kendi hesabının durumunu değiştiremezsin.",
  request_not_found: "Talep bulunamadı veya zaten sonuçlanmış.",
  dorm_exists: "Bu ilde bu adla bir yurt zaten var.",
  dorm_in_use: "Bu yurtta kullanıcı veya ilan var; silinemez. Bunun yerine listeden kaldırabilirsin.",
  invalid_dorm: "İl ve yurt adını kontrol et.",
};

type DbError = { message?: string; code?: string; details?: string | null } | null | undefined;

export const PHONE_TAKEN = "Bu numara başka bir hesapta kayıtlı. Numara sana aitse bize bildir.";

export function isPhoneTaken(error: DbError): boolean {
  return error?.code === "23505" && (error.message ?? "").includes("profile_private_phone_key");
}

export function dbErrorMessage(error: DbError, fallback = "Bir şeyler ters gitti. Lütfen tekrar dene."): string {
  if (!error) return fallback;
  if (isPhoneTaken(error)) return PHONE_TAKEN;
  if (error.code === "23505" && (error.message ?? "").includes("reports_reporter_id_reported_user_id_key")) {
    return "Bu kişiyi daha önce şikayet ettin.";
  }
  const key = (error.message ?? "").trim();
  return MESSAGES[key] ?? fallback;
}
