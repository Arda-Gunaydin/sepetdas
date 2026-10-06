// Türkiye cep numarası: kullanıcı "05xx xxx xx xx" yazar, veritabanında "+905xxxxxxxxx" saklanır.

/** Kullanıcı girdisini "+905xxxxxxxxx" biçimine çevirir; geçersizse null döner. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("5") && digits.length === 10) digits = `0${digits}`;
  if (!/^05\d{9}$/.test(digits)) return null;
  return `+9${digits}`;
}

/** "+905321234567" → "0532 123 45 67" */
export function formatPhone(e164: string): string {
  const d = `0${e164.replace(/^\+90/, "")}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

export function telLink(e164: string): string {
  return `tel:${e164}`;
}

export function whatsappLink(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
}
