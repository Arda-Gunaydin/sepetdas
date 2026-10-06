# Yurt listesi (`dorms.csv`)

**Kaynak:** T.C. Gençlik ve Spor Bakanlığı, Kredi ve Yurtlar Genel Müdürlüğü (KYGM) —
"İl-İlçe Bazında Kapasite Tablosu", 2021-2022 (Ağustos-Şubat dönemi) KYGM Yurt Listesi (Ek-3).
Belge, KYGM ile Diyanet İşleri Başkanlığı arasındaki manevi danışmanlık protokolünün eki olarak
Diyanet'in sitesinde yayımlanmıştır:
https://webdosyasp.diyanet.gov.tr/muftuluk/UserFiles/sivas/UserFiles/Files/Ek-3_2021-2022(A%C4%9Fustos-%C5%9EubatD%C3%B6nemi)KYGMYurtListesi%20(2)_d6f2710f-7b91-45b7-930e-24f367e78101.pdf

Belgede 81 ilde 768 satır var; tekrar eden bir satır çıkınca **767 yurt** kaldı.

Önceki sürüm GSB/KYGM'nin 2019 tarihli "seçime çıkılacak işletme yerlerinin listesi"nden alınmıştı
(353 yurt). O belge sadece kantin/lokanta ihalesine çıkan yurtları içerdiği için eksikti; yerine bu liste kullanıldı.

## Yapılan düzenlemeler

- Büyük harfli adlar Türkçe kurallarıyla başlık biçimine çevrildi ("ADANA ÖĞRENCİ YURDU" → "Adana Öğrenci Yurdu").
- Kaynaktaki Türkçe karaktersiz genel kelimeler düzeltildi: "Ogrenci/Ögrenci" → "Öğrenci", "Ögr." → "Öğr.",
  "Birligi" → "Birliği", "Karabuk" → "Karabük". Özel adlara dokunulmadı.
- Boşluklar düzenlendi: "Yurdu(Adana)" → "Yurdu (Adana)", "Besni- Servi" → "Besni - Servi", "Prof.Dr." → "Prof. Dr.".
  İzafet tireleri ("Hamid-i Veli", "Hacı Bayram-ı Veli") olduğu gibi bırakıldı.

## Bilinen sınırlar

Liste 2021-2022 dönemine ait. Sonradan açılan, kapanan veya adı değişen yurtlar olabilir. Eksik yurtlar
"Yurdum listede yok" talebi ve yönetici onayıyla eklenir. Daha güncel resmi liste bulunursa bu dosya
değiştirilir ve `npm run db:seed-dorms -- --replace` çalıştırılır.

**`--replace` uyarısı:** CSV'de olmayan yurtlar silinir; profil veya ilan bağlı olanlar silinmez, pasifleştirilir.
Yönetici onayıyla eklenmiş yurtlar CSV'ye eklenmeden `--replace` çalıştırılırsa onlar da kaldırılır.
