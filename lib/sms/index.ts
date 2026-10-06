// SMS doğrulaması henüz yok (maliyet nedeniyle bilinçli karar, bkz. CLAUDE.md §7.3).
// Eklendiğinde bu arayüz Netgsm OTP SMS ile uygulanacak; çağıran kod değişmeyecek.

export interface SmsProvider {
  /** Numaraya tek kullanımlık kod gönderir. phone: "+905xxxxxxxxx" */
  sendOtp(phone: string): Promise<void>;
  /** Kod doğruysa true döner. */
  verifyOtp(phone: string, code: string): Promise<boolean>;
}

class NotImplementedSmsProvider implements SmsProvider {
  async sendOtp(): Promise<void> {
    throw new Error("SMS doğrulaması henüz uygulanmadı.");
  }

  async verifyOtp(): Promise<boolean> {
    throw new Error("SMS doğrulaması henüz uygulanmadı.");
  }
}

export const sms: SmsProvider = new NotImplementedSmsProvider();
