import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { Notice } from "@/components/ui/notice";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/pano" aria-label="Sepetdaş ana sayfa" className="flex min-h-11 items-center">
            <Logo />
          </Link>
          <div className="flex min-w-0 items-center gap-1">
            {profile.is_admin ? (
              <Link
                href="/admin"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Yönetici ekranı"
              >
                <ShieldCheck className="size-5" aria-hidden />
              </Link>
            ) : null}
            <span className="truncate text-right text-sm font-semibold text-muted-foreground" title={profile.dorm?.name}>
              {profile.dorm?.name}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pt-5 pb-28">
        {profile.status !== "active" ? (
          <Notice tone="warning" title="Hesabın askıya alındı">
            Hakkında gelen şikayetler nedeniyle hesabın inceleniyor. Bu sürede ilan açamaz ve numara göremezsin.
          </Notice>
        ) : null}
        {children}
        <Disclaimer className="mt-auto pt-4" />
      </main>

      <BottomNav />
    </div>
  );
}
