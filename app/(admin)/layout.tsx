import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/ui/logo";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const [reports, dormRequests, claims] = await Promise.all([
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("dorm_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("phone_claims").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin" aria-label="Yönetici paneli" className="flex min-h-11 items-center">
              <Logo />
            </Link>
            <span className="hidden items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-soft-foreground sm:inline-flex">
              <ShieldCheck className="size-3.5" aria-hidden />
              Yönetici paneli
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-sm text-muted-foreground md:inline">{profile.full_name}</span>
            <Link
              href="/pano"
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Siteye dön
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <AdminNav counts={{ reports: reports.count ?? 0, requests: (dormRequests.count ?? 0) + (claims.count ?? 0) }} />
        <main className="flex min-w-0 flex-col gap-5 pt-2 pb-12 lg:pt-5">{children}</main>
      </div>
    </div>
  );
}
