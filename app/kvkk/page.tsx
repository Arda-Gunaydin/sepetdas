import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { DATA_CONTROLLER } from "@/lib/site";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex flex-col gap-2 text-foreground/90">{children}</div>
    </section>
  );
}

export default function KvkkPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Ana sayfa" className="flex min-h-11 items-center">
          <Logo />
        </Link>
      </header>
      <Link href="/" className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-5" aria-hidden />
        Geri
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight">KVKK Aydınlatma Metni</h1>
      <p className="text-muted-foreground">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, Sepetdaş&apos;ı kullanırken hangi verilerinin
        işlendiğini, neden işlendiğini, kimlerin görebildiğini ve nasıl silebileceğini aşağıda bulabilirsin.
      </p>

      <Section title="1. Veri sorumlusu">
        <p>
          {DATA_CONTROLLER.name ? `${DATA_CONTROLLER.name} (“Sepetdaş”).` : "Sepetdaş."}
          {DATA_CONTROLLER.email ? (
            <>
              {" "}
              İletişim:{" "}
              <a href={`mailto:${DATA_CONTROLLER.email}`} className="font-semibold text-accent underline underline-offset-2">
                {DATA_CONTROLLER.email}
              </a>
            </>
          ) : null}
        </p>
      </Section>

      <Section title="2. Hangi verileri işliyoruz?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Google hesabından gelen e-posta adresin ve adın (giriş için)</li>
          <li>Ad soyad, il, yurt ve isteğe bağlı blok / kat bilgin</li>
          <li>Cep telefonu numaran</li>
          <li>Açtığın ilanların içeriği (restoran, platform, tutar, açıklama) ve açılış / bitiş zamanları</li>
          <li>Hangi ilanın numarasını ne zaman açtığının kaydı</li>
          <li>Siteyi en son ne zaman kullandığın (yalnızca yönetici görür; diğer kullanıcılar görmez)</li>
          <li>Gönderdiğin şikayetler, yurt ekleme ve numara sahipliği talepleri</li>
          <li>Açık rıza verdiğin tarih ve saat</li>
          <li>Oturumunu açık tutmak için gereken teknik çerezler</li>
        </ul>
      </Section>

      <Section title="3. Neden işliyoruz?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Aynı yurtta birlikte yemek siparişi vermek isteyen öğrencileri eşleştirmek</li>
          <li>İlanla ilgilenen yurt arkadaşının sana ulaşabilmesini sağlamak</li>
          <li>Kötüye kullanımı önlemek: numara açma sınırı, şikayet inceleme, sahte hesapları askıya alma</li>
        </ul>
        <p>
          Hukuki sebepler: açık rızan (KVKK m. 5/1), hizmetin sunulması için gerekli olması (m. 5/2-c) ve kötüye kullanımı
          önlemedeki meşru menfaat (m. 5/2-f).
        </p>
      </Section>

      <Section title="4. Verilerini kim görür?">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Aynı yurttaki giriş yapmış kullanıcılar:</strong> adın ve soyadının baş harfi, yurdun, blok / kat bilgin ve
            ilanların.
          </li>
          <li>
            <strong>Telefon numaran:</strong> hiçbir listede görünmez. Yalnızca ilanın aktifken, aynı yurttaki ve hesabı askıda
            olmayan bir kullanıcı &quot;Numarayı göster&quot;e bastığında ona açılır. İlan kapanınca veya süresi dolunca numara
            artık açılamaz.
          </li>
          <li>
            <strong>Yönetici:</strong> şikayetleri, askıya alınan hesapları ve talepleri incelemek için gereken bilgiler;
            kötüye kullanımı inceleyebilmek için süresi dolmuş ve kapanmış ilanlar ile numara açma kayıtları dahil. Yönetici,
            seninle iletişime geçmesi gerektiğinde (ör. şikayet veya numara sahipliği talebi) e-posta adresini de görebilir;
            telefon numaranı görmez.
          </li>
          <li>
            <strong>Hizmet sağlayıcılar:</strong> veriler, altyapı hizmeti aldığımız Supabase (veritabanı ve kimlik doğrulama),
            Vercel (barındırma) ve Google (giriş) sunucularında işlenir. Bu sağlayıcıların sunucuları yurt dışında
            bulunabilir; açık rızan bu aktarımı da kapsar.
          </li>
        </ul>
        <p>Verilerin bunlar dışında kimseyle paylaşılmaz, satılmaz ve reklam amacıyla kullanılmaz.</p>
      </Section>

      <Section title="5. Ne kadar saklıyoruz, nasıl silinir?">
        <p>
          İlanların 15 dakika (uzatırsan daha uzun) yayında kalır; süresi dolan veya kapattığın ilan diğer kullanıcılardan
          ve senden kaldırılır, ancak kötüye kullanım incelemesi için hesabın açık olduğu sürece yalnızca yöneticinin
          görebileceği şekilde saklanır. Diğer verilerin de hesabın açık olduğu sürece saklanır. <strong>Profil → &quot;Hesabımı ve verilerimi sil&quot;</strong>{" "}
          butonuyla hesabını istediğin an silebilirsin. Silme işlemi geri alınamaz: profilin, telefon numaran, ilanların,
          numara görüntüleme kayıtların, son görülme bilgin ve şikayet kayıtların kalıcı olarak silinir.
        </p>
      </Section>

      <Section title="6. Hakların">
        <p>
          KVKK m. 11 uyarınca verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini
          isteme, işlemeye itiraz etme ve zarara uğraman hâlinde giderilmesini talep etme haklarına sahipsin. Açık rızanı
          dilediğin zaman hesabını silerek geri alabilirsin.
        </p>
      </Section>

      <Section title="7. Önemli not">
        <p>
          Sepetdaş yalnızca eşleştirme yapar. Sipariş, ödeme ve teslimat tamamen kullanıcılar arasında, site dışında gerçekleşir;
          Sepetdaş bu işlemlerin tarafı değildir.
        </p>
      </Section>

      <footer className="border-t border-border pt-6">
        <Disclaimer />
      </footer>
    </main>
  );
}
