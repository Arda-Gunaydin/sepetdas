# Sepetdaş — CLAUDE.md

> Sitenin adı **Sepetdaş** (eski çalışma adı "Yemek Arkadaşı"). Bu dosya projenin tek doğruluk kaynağıdır; bir karar değişirse önce burayı güncelle.
>
> Next.js 16 kullanılıyor; API farkları için `AGENTS.md` ve `node_modules/next/dist/docs/` okunmalı (ör. `middleware` yerine `proxy.ts`, `params`/`searchParams`/`cookies()` asenkron).

@AGENTS.md

## 1. Proje özeti

KYK yurtlarında kalan öğrencilerin **birlikte yemek siparişi verecek kişi bulduğu** basit bir eşleşme panosu.

Çözdüğü problem:

- Söyleyeceğim yemek 400 TL ama minimum sepet tutarı 450 TL → eksik tutarı tamamlayacak biri lazım.
- 2'li menü / kampanya ile kişi başı fiyat düşüyor (ör. 400 TL yerine 300 TL) → menüyü paylaşacak biri lazım.
- Teslimat ücretini bölüşmek.

Site **sadece eşleştirir**. Kullanıcı ilanı görür, numarayı açar, arar veya WhatsApp'tan yazar; sipariş ve ödeme kullanıcılar arasında, site dışında halledilir.

## 2. Kapsam

### MVP'de VAR

- Google ile giriş + profil tamamlama (ad soyad, il, yurt, telefon)
- Kullanıcının kendi yurduna ait aktif ilanların panosu
- İlan açma, düzenleme, kapatma, "eşleşti" işaretleme
- İlanın otomatik süresinin dolması
- "Numarayı göster" → Ara / WhatsApp'tan yaz
- Şikayet etme
- Hesabı ve tüm veriyi silme, KVKK açık rıza onayı
- Basit yönetici ekranı (şikayetler, askıya alınan hesaplar, yurt ekleme talepleri)

### MVP'de YOK (istenmeden ekleme)

- Site içi ödeme, hesap bölüşme, cüzdan
- Site içi mesajlaşma / sohbet
- SMS doğrulaması (altyapısı hazır bırakılacak, bkz. 7.3)
- Yemek platformlarıyla (Yemeksepeti, Getir, Trendyol Yemek) entegrasyon; restoran ve fiyat bilgisi serbest metin
- Yurtlar arası ilan görme

### Sonraki sürümler

1. SMS doğrulaması (Netgsm OTP) ve "doğrulanmış numara" rozeti
2. PWA push bildirimi: yurdumda yeni ilan açıldı
3. "Bu restorandan ilan açılınca haber ver"
4. Güven göstergesi ("3 kez eşleşti")
5. Yurt bazlı en çok sipariş verilen restoranlar

## 3. Teknoloji

- **Next.js** (App Router, TypeScript strict)
- **Tailwind CSS**; arayüz önce telefon için tasarlanır (kullanıcıların çoğu telefondan girecek)
- **Supabase**: Postgres, Auth (Google OAuth), Row Level Security
- **Zod** ile form ve sunucu tarafı doğrulama
- Yayın: **Vercel** + Supabase ücretsiz katman

Yeni bağımlılık eklemeden önce gerçekten gerekli mi diye sor; proje küçük kalmalı.

## 4. Kullanıcı akışı

1. **Giriş:** "Google ile giriş yap".
2. **Profil tamamlama** (ilk girişte zorunlu, tamamlanmadan pano açılmaz):
   - Ad soyad
   - İl → Yurt (listeden seçilir; yoksa "Yurdum listede yok" talebi)
   - Telefon (05xx xxx xx xx)
   - Blok / kat (isteğe bağlı)
   - KVKK açık rıza kutusu (işaretlenmeden devam edilemez)
3. **Pano:** kendi yurdundaki aktif ilanlar, en yeni üstte. Filtre: ilan türü, platform. Pano dakikada bir kendini yeniler.
4. **İlan aç:** bkz. 5.3.
5. **İlan detayı:** "Numarayı göster" butonu → numara açılır, "Ara" (`tel:`) ve "WhatsApp'tan yaz" (`https://wa.me/90...?text=...` hazır mesajla) butonları çıkar.
6. **İlan sahibi:** "Eşleştim" veya "İlanı kapat" → ilan kalkar (`close_listing` RPC). Son 2 dakikada "+15 dk ekle" ile süreyi uzatır (`extend_listing` RPC).

## 5. Veri modeli

Tablo ve sütun adları İngilizce, arayüz metinleri Türkçe.

### 5.1 `dorms`

`id`, `city`, `name`, `is_active`, `created_at`

- **Yurt adlarını UYDURMA.** Liste `supabase/seed/dorms.csv` dosyasından yüklenir (`npm run db:seed-dorms`). Şu anki liste KYGM'nin 2021-2022 "İl-İlçe Bazında Kapasite Tablosu"ndan derlendi: 81 il, 767 yurt; kaynak ve yapılan düzenlemeler `supabase/seed/README.md`'de. Daha güncel resmi liste gelirse bu dosya değiştirilir.
- İlk aşamada liste eksik olabilir; bu yüzden `dorm_requests` (`id`, `user_id`, `city`, `dorm_name`, `status`) tablosu ve "Yurdum listede yok" formu var. Yönetici onaylayınca yurt eklenir.

### 5.2 `profiles` ve `profile_private`

`profiles` (aynı yurttakilere görünür): `id` (= `auth.users.id`), `full_name`, `dorm_id`, `block`, `status` (`active` | `suspended` | `banned`), `is_admin`, `created_at`

`profile_private` (sadece sahibi ve sunucu fonksiyonları erişir): `user_id`, `phone` (**UNIQUE**), `phone_verified` (varsayılan `false`), `phone_changed_at`, `consent_at`

Telefonun ayrı tabloda durmasının sebebi: ilan sorgularında yanlışlıkla istemciye sızmasın.

`phone_claims` (`id`, `user_id`, `phone`, `note`, `status` (`open` | `resolved`), `created_at`): "Bu numara başka bir hesapta kayıtlı, numara bana ait" talepleri; yönetici ekranında görünür.

### 5.3 `listings`

- `id`, `owner_id`, `dorm_id`
- `type`: `min_basket` (sepet tamamlama) | `shared_menu` (menü/kampanya paylaşma) | `delivery_fee` (teslimat ücreti bölüşme)
- `platform`: `yemeksepeti` | `getir` | `trendyol` | `migros` | `phone_order` | `other`
- `restaurant` (metin), `description` (ne söyleyeceği, kısa metin)
- `missing_amount` (TL; `min_basket` için: "50 TL eksik")
- `price_per_person` (TL; `shared_menu` için, isteğe bağlı)
- `people_needed` (varsayılan 1)
- `expires_at`: oluşturulduktan **15 dakika** sonra. İlan sahibi sadece **son 2 dakikada** "+15 dk" ekleyebilir (`expires_at + 15 dk`); toplam ömür oluşturulduktan en fazla 6 saat. Uzatılmazsa ilan kaldırılır.
- (Sipariş saati alanı 2026-10-07'de kaldırıldı.)
- `status`: `active` | `matched` | `closed` | `hidden`
- `created_at`

Süre dolması için zamanlanmış görev **kullanma**; aktif ilan = `status = 'active' AND expires_at > now()`.

**Görünürlük:** süresi dolan, eşleşen, kapanan veya gizlenen ilanlar kullanıcılara **hiç görünmez — sahibi dahil** (RLS). Kayıt veritabanında kalır; yönetici `/admin/ilanlar`'da geçmiş/şimdiki tüm ilanları ve numara açma sayılarını görür. Bu yüzden ilan durumu istemciden doğrudan UPDATE ile değiştirilemez (yeni satır SELECT politikasını geçemez); `close_listing()` kullanılır. Hesap silinince ilanlar yine tamamen silinir.

### 5.4 `phone_reveals`

`id`, `listing_id`, `viewer_id`, `created_at` — numarayı kimin açtığının kaydı; hız sınırı ve kötüye kullanım incelemesi için.

### 5.4.1 `user_activity`

`user_id` (PK, `profiles` → CASCADE), `last_seen_at` — yönetici panelindeki "çevrim içi" durumu için. Açık sekme dakikada bir `touch_last_seen()` RPC'sini çağırır (`components/heartbeat.tsx`, sekme arka plandaysa çağırmaz); fonksiyon en fazla ~dakikada bir yazar. Çevrim içi = `last_seen_at` son 2 dakika içinde (`lib/admin.ts`). Sadece yönetici okur (RLS); diğer kullanıcılar birbirinin çevrim içi durumunu göremez. Ayrı tablodadır çünkü `profiles`'ı aynı yurttakiler okuyabilir.

### 5.5 `reports`

`id`, `reporter_id`, `listing_id`, `reported_user_id`, `reason` (`wrong_number` | `not_their_number` | `spam` | `inappropriate` | `other`), `note`, `status` (`open` | `resolved`), `created_at`

Aynı kişi aynı kullanıcıyı bir kez şikayet edebilir.

## 6. İş kuralları

- Kullanıcı sadece **kendi yurdunun** ilanlarını görür ve sadece kendi yurduna ilan açar.
- Kişi başı aynı anda en fazla **2 aktif ilan**.
- Telefon numarası formatı: Türkiye cep numarası, `05` ile başlar, 11 hane. Veritabanında `+905xxxxxxxxx` biçiminde saklanır.
- **Bir numara = bir hesap** (UNIQUE). Numara kayıtlıysa: "Bu numara başka bir hesapta kayıtlı. Numara size aitse bize bildirin." → yöneticiye talep düşer.
- Numara **30 günde en fazla bir kez** değiştirilebilir.
- Yurt değişikliği serbest, ama değişince açık ilanlar kapanır.
- Numarayı açma sınırı: kullanıcı başına günde en fazla **20** farklı ilan.
- Bir kullanıcı hakkında **3 farklı kişiden** `wrong_number` veya `not_their_number` şikayeti gelirse: ilanları `hidden` olur, hesap `suspended` olur, yönetici inceler.
- `suspended` / `banned` kullanıcı ilan açamaz ve numara göremez.
- Hesap silinince profil, telefon, ilanlar ve o kullanıcıya ait kayıtlar tamamen silinir (soft delete değil).

## 7. Güvenlik ve gizlilik (pazarlık yok)

### 7.1 Telefon numarası

- Telefon numarası **hiçbir liste/pano sorgusunda istemciye gönderilmez**.
- Numara sadece `reveal_phone(listing_id)` adlı `SECURITY DEFINER` Postgres fonksiyonu (RPC) ile döner. Fonksiyon şunları kontrol eder: çağıran giriş yapmış ve `active` mi, ilanla aynı yurtta mı, ilan aktif mi, günlük sınır aşılmış mı. Geçerse `phone_reveals`'a kayıt atar ve numarayı döner.
- İlan kapandıktan veya süresi dolduktan sonra numara yeniden açılamaz.

### 7.2 RLS

- Her tabloda RLS açık. RLS'siz tablo bırakma.
- `listings`: SELECT sadece aynı `dorm_id`'ye sahip `active` kullanıcılar; INSERT/UPDATE/DELETE sadece sahibi.
- `profile_private`: sadece sahibi okur/yazar.
- `reports`: kullanıcı sadece INSERT yapar, okuyamaz; yönetici okur.
- İstemci tarafındaki kontrollere güvenme; her kural veritabanında veya sunucuda da uygulanmalı.
- `service_role` / secret anahtarı asla istemci koduna veya `NEXT_PUBLIC_` değişkenine konmaz. Şu an uygulama bu anahtarı **hiç kullanmıyor**: hesap silme (`delete_my_account`) ve yönetici işlemleri (`admin_*`) `SECURITY DEFINER` fonksiyonlarla yapılıyor.
- Kullanıcı tarafından değiştirilemeyecek sütunlar (`profiles.status`, `profiles.is_admin`, `profile_private.phone_verified`, `listings.owner_id/dorm_id/expires_at/status`) sütun bazlı `GRANT` ile korunuyor; iş kuralları `supabase/migrations/*_rules.sql` trigger'larında. Trigger'lar sadece `current_user = 'authenticated'` isteklerinde kural uygular; sistem fonksiyonları ve scriptler (postgres) atlar.

### 7.3 SMS doğrulamasına hazırlık

Şu an SMS doğrulaması yok (maliyet nedeniyle bilinçli karar). Sonradan eklenebilmesi için:

- `phone_verified` sütunu baştan var.
- SMS gönderimi `lib/sms/` altında tek bir arayüzün arkasında dursun (`sendOtp(phone)`, `verifyOtp(phone, code)`); şimdilik uygulanmamış bırak. Hedef sağlayıcı: Netgsm OTP SMS.
- Arayüzde doğrulanmamış numara için uyarı gösterme; ileride doğrulanmışlara rozet eklenecek.

### 7.4 KVKK

- Kayıtta açık rıza metni ve onay kutusu; onay zamanı `consent_at`'e yazılır.
- Aydınlatma metni sayfası: hangi veri, neden, kim görür, nasıl silinir.
- Profil ekranında "Hesabımı ve verilerimi sil" butonu.
- Sitede görünür bir uyarı: "Site yalnızca eşleştirir; sipariş ve ödeme kullanıcılar arasındadır."

## 8. Sayfalar

| Yol | İçerik |
|---|---|
| `/` | Tanıtım + Google ile giriş (giriş yapılmışsa `/pano`'ya yönlendir) |
| `/kayit` | Profil tamamlama |
| `/pano` | Yurdun aktif ilanları, filtreler, "İlan aç" butonu |
| `/ilan/yeni` | İlan formu (türe göre alanlar değişir) |
| `/ilan/[id]` | İlan detayı, numarayı göster, şikayet et |
| `/ilan/[id]/duzenle` | İlan sahibinin aktif ilanı düzenlemesi |
| `/ilanlarim` | Kendi ilanlarım; kapat / eşleşti |
| `/profil` | Bilgileri düzenle, hesabı sil |
| `/kvkk` | Aydınlatma metni |
| `/admin` | Yönetici paneli (ayrı düzen, sadece `is_admin`): genel bakış sayıları (şu an çevrim içi dahil), en kalabalık yurtlar, son ilanlar |
| `/admin/kullanicilar` | Kullanıcı listesi: isim arama, il / yurt / durum (çevrim içi dahil) filtresi, ilan sayısı, çevrim içi noktası |
| `/admin/kullanicilar/[id]` | Kullanıcı detayı: bilgiler, çevrim içi / son görülme, e-posta (iletişim için, `admin_user_email` RPC), verdiği tüm ilanlar, şikayet geçmişi, askıya alma / engelleme (telefon gösterilmez) |
| `/admin/ilanlar` | Geçmiş ve şimdiki tüm ilanlar, durum filtresi, numara açma sayısı |
| `/admin/sikayetler` | Açık / çözülen şikayetler |
| `/admin/talepler` | Yurt ekleme ve numara sahipliği talepleri |

## 9. Kod kuralları

- Kod, değişken ve tablo adları İngilizce; kullanıcıya görünen tüm metinler Türkçe.
- Sunucu bileşenleri varsayılan; istemci bileşeni sadece etkileşim gerekiyorsa.
- Veri değiştiren işlemler Server Action ile; girdiler Zod ile sunucuda doğrulanır.
- Veritabanı değişiklikleri sadece `supabase/migrations/` altında SQL migration olarak; panelden elle değişiklik yapılmaz.
- Para değerleri tam sayı TL olarak saklanır.
- Saatler veritabanında UTC (`timestamptz`), arayüzde `Europe/Istanbul`.
- Gizli anahtarlar `.env.local` içinde; repoya girmez. `.env.example` güncel tutulur.

## 10. Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu: http://localhost:3000 |
| `npm run build` / `npm start` | Production build / çalıştırma |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run db:push` | `supabase/migrations` altındaki yeni migration'ları `SUPABASE_DB_URL` veritabanına uygular |
| `npm run db:types` | `lib/supabase/database.types.ts`'i şemadan yeniden üretir (Docker gerekir; yoksa dosyayı şemaya göre elle güncelle) |
| `npm run db:seed-dorms` | `supabase/seed/dorms.csv` → `dorms` (yenileri ekler). `-- --replace`: CSV'de olmayanları kaldırır (bağlı olanları pasifleştirir; yönetici onaylı yurtlar CSV'de yoksa onlar da gider) |
| `npm run db:make-admin -- <email>` | Profili tamamlanmış kullanıcıyı yönetici yapar (ilk admin böyle atanır) |
| `npm run test:db` | RLS / `reveal_phone` / iş kuralı testleri (`tests/db/`, her test işlem içinde koşup geri alınır) |

Ortam değişkenleri `.env.example`'da. `SUPABASE_DB_URL` sadece scriptler/testler içindir, Vercel'e eklenmez.

**Yayın:** GitHub `Arda-Gunaydin/sepetdas` → Vercel projesi `sepetdas` (takım `burslistele`), canlı adres **https://sepetdas.vercel.app**. `main`'e her push otomatik yayına çıkar. Vercel'de sadece `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` var. Supabase Auth → Site URL `https://sepetdas.vercel.app`; Redirect URLs: `https://sepetdas.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`. Google OAuth uygulaması şu an "Testing" modunda (sadece test kullanıcıları girebilir); herkese açmadan önce Google Auth Platform → Audience → Publish app.

## 11. Yapım sırası

1. Next.js + Tailwind + Supabase kurulumu, Google ile giriş
2. Migration'lar: tablolar, RLS politikaları, `reveal_phone` fonksiyonu
3. Profil tamamlama akışı (il → yurt seçimi, telefon doğrulama kuralları)
4. Pano ve ilan açma
5. İlan detayı, numarayı göster, Ara / WhatsApp
6. İlanlarım, kapat / eşleşti
7. Şikayet ve otomatik askıya alma
8. Profil düzenleme, hesap silme, KVKK sayfası
9. Yönetici ekranı
10. Vercel'e yayın

Her adımın sonunda çalışır halde bırak ve ne yapıldığını kısaca özetle.

## 12. Claude Code için çalışma notları

- Açıklamaları Türkçe yap.
- Büyük bir adıma başlamadan önce kısa planı göster, onay al.
- RLS politikası veya `reveal_phone` fonksiyonunu değiştirdiğinde şu senaryoları test et: başka yurttan kullanıcı ilanı göremiyor, başka yurttan kullanıcı numarayı açamıyor, askıdaki kullanıcı numara açamıyor, günlük sınır çalışıyor.
- Bu dosyada "MVP'de YOK" denen bir şeyi istenmeden ekleme.
- Yurt adı, restoran adı gibi gerçek dünya verilerini uydurma; eksikse sor.
