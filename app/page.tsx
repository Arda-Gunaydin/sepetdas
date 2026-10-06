import { Bike, Clock, MessageCircle, Phone, ShoppingBasket, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { Notice } from "@/components/ui/notice";
import { getUserId } from "@/lib/auth";

const useCases = [
  {
    Icon: ShoppingBasket,
    title: "Sepeti tamamla",
    text: "Söyleyeceğin yemek 400 TL, minimum sepet 450 TL. Eksik 50 TL'yi tamamlayacak biri yurdunda.",
  },
  {
    Icon: Users,
    title: "Menüyü paylaş",
    text: "2'li menüyle kişi başı 400 TL yerine 300 TL. Menüyü bölüşecek bir yurt arkadaşı bul.",
  },
  {
    Icon: Bike,
    title: "Teslimatı bölüş",
    text: "Aynı yerden sipariş verip teslimat ücretini ikiye böl.",
  },
];

const steps = [
  { Icon: Clock, text: "İlan aç: ne söyleyeceğini yaz. İlan 15 dakika panoda kalır, istersen uzatırsın." },
  { Icon: Phone, text: "Yurdundan biri ilanı görür, numaranı açar." },
  { Icon: MessageCircle, text: "Arayıp ya da WhatsApp'tan yazışıp siparişi birlikte verirsiniz." },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  // Supabase dönüş adresi izinli listede yoksa Google girişi "Site URL"ye (ana sayfa) ?code= ile döner.
  // Aynı alan adındaysak girişi tamamlamak için callback'e aktar.
  if (typeof params.code === "string" && /^[\w-]{8,200}$/.test(params.code)) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }
  if (await getUserId()) redirect("/pano");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-4 pt-6 pb-10">
      <header>
        <Logo />
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
          Yurdunda <span className="text-primary">sipariş arkadaşını</span> bul.
        </h1>
        <p className="text-lg text-muted-foreground">
          Minimum sepete az mı kaldı, 2&apos;li menü mü var? Aynı KYK yurdunda birlikte sipariş verecek birini bul,
          arayıp ya da WhatsApp&apos;tan anlaşın.
        </p>
        {params.hata === "giris" ? (
          <Notice tone="error" title="Giriş yapılamadı">
            Lütfen tekrar dene.
          </Notice>
        ) : null}
        {params.silindi === "1" ? (
          <Notice tone="success" title="Hesabın silindi">
            Tüm verilerin kalıcı olarak silindi.
          </Notice>
        ) : null}
        <GoogleSignIn />
        <p className="text-sm text-muted-foreground">
          Giriş yaparak{" "}
          <Link href="/kvkk" className="font-semibold text-accent underline underline-offset-2">
            aydınlatma metnini
          </Link>{" "}
          okuduğunu kabul edersin.
        </p>
      </section>

      <section aria-labelledby="neler" className="flex flex-col gap-3">
        <h2 id="neler" className="text-xl font-bold">
          Ne işe yarar?
        </h2>
        <ul className="grid gap-3">
          {useCases.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="nasil" className="flex flex-col gap-3">
        <h2 id="nasil" className="text-xl font-bold">
          Nasıl çalışır?
        </h2>
        <ol className="flex flex-col gap-3">
          {steps.map(({ Icon, text }, i) => (
            <li key={text} className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-soft-foreground">
                {i + 1}
              </span>
              <span className="flex items-center gap-2">
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                {text}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground">
          Sadece kendi yurdundaki ilanları görürsün. Numaran ilanda yazmaz; sadece giriş yapmış yurt arkadaşların
          &quot;Numarayı göster&quot; dediğinde açılır.
        </p>
      </section>

      <footer className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
        <Disclaimer />
        <Link href="/kvkk" className="min-h-11 text-sm font-semibold text-accent underline underline-offset-2">
          KVKK aydınlatma metni
        </Link>
      </footer>
    </main>
  );
}
