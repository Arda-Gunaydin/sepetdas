# Sepetdaş

KYK yurtlarında birlikte yemek siparişi verecek kişi bulma panosu. Proje kuralları ve kararlar: [`CLAUDE.md`](./CLAUDE.md).

Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, RLS) · Zod

## Kurulum

1. Bağımlılıklar: `npm install`
2. `.env.example` dosyasını `.env.local` olarak kopyala ve doldur:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase → Project Settings → API Keys
   - `NEXT_PUBLIC_SITE_URL`: yerelde `http://localhost:3000`
   - `SUPABASE_DB_URL`: Supabase → **Connect** → **Session pooler** bağlantı dizesi (şifreyle). Sadece scriptler ve testler kullanır.
3. Veritabanı:
   ```bash
   npm run db:push         # migration'lar
   npm run db:seed-dorms   # yurt listesi (supabase/seed/dorms.csv)
   npm run test:db         # RLS ve iş kuralı testleri
   ```
4. Google ile giriş (aşağıda) ayarlandıktan sonra: `npm run dev` → http://localhost:3000
5. İlk yönetici: siteye giriş yapıp profilini tamamla, sonra `npm run db:make-admin -- ornek@example.com`

## Google ile giriş

**Google Cloud Console** → APIs & Services:

1. OAuth consent screen: uygulama adı "Sepetdaş", destek e-postası. Test aşamasında kendi hesabını "Test users"a ekle.
2. Credentials → Create credentials → OAuth client ID → **Web application**
   - Authorized JavaScript origins: `http://localhost:3000` (yayında Vercel adresi de)
   - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`

**Supabase paneli:**

1. Authentication → Sign In / Providers → **Google**: aç, Client ID ve Client Secret'ı gir.
2. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (yayında Vercel adresi)
   - Redirect URLs: `http://localhost:3000/auth/callback` (yayında `https://<alan-adı>/auth/callback` da)

Client Secret sadece Supabase paneline girilir; koda ve `.env.local`'e girmez.

## Komutlar

`CLAUDE.md` §10'a bak.
