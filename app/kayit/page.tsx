import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DormRequestForm } from "@/components/profile/dorm-request-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { signOut } from "@/lib/actions/auth";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { getProfile, requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profilini tamamla" };

export default async function RegisterPage() {
  await requireUserId();
  if (await getProfile()) redirect("/pano");

  const supabase = await createClient();
  const [{ data: dorms }, { data: userData }] = await Promise.all([
    supabase.from("dorms").select("id, city, name").eq("is_active", true).order("name"),
    supabase.auth.getUser(),
  ]);
  const googleName = (userData.user?.user_metadata?.full_name as string | undefined) ?? undefined;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex items-center justify-between">
        <Logo />
        <form action={signOut}>
          <button type="submit" className="min-h-11 cursor-pointer px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Çıkış
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Profilini tamamla</h1>
        <p className="text-muted-foreground">Panoyu görmek için birkaç bilgi lazım. Sadece kendi yurdunun ilanlarını göreceksin.</p>
      </div>

      <ProfileForm dorms={dorms ?? []} defaultName={googleName} />

      <details className="group rounded-2xl border border-border bg-surface p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Yurdum listede yok</summary>
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Yurt listesi resmi KYGM kaynağından (2021-2022) alındı; sonradan açılan yurtlar eksik olabilir. Yurdunu yaz, yönetici onaylayınca listeye eklensin.
          </p>
          <DormRequestForm />
        </div>
      </details>

      <Disclaimer />
    </main>
  );
}
