import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-extrabold">Sayfa bulunamadı</h1>
      <p className="text-muted-foreground">Aradığın ilan kaldırılmış, süresi dolmuş ya da başka bir yurda ait olabilir.</p>
      <Link href="/pano" className={buttonClasses("primary")}>
        Panoya dön
      </Link>
    </main>
  );
}
