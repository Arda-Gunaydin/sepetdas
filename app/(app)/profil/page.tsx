import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";
import { PhoneEditForm } from "@/components/profile/phone-edit-form";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Card, PageTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/lib/actions/auth";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextPhoneChangeAt } from "@/lib/time";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: dorms }, { data: priv }] = await Promise.all([
    supabase.from("dorms").select("id, city, name").eq("is_active", true).order("name"),
    supabase.from("profile_private").select("phone, phone_changed_at").eq("user_id", profile.id).maybeSingle(),
  ]);

  const nextChange = nextPhoneChangeAt(priv?.phone_changed_at ?? null);

  return (
    <>
      <PageTitle title="Profil" />

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Bilgilerim</h2>
        <ProfileEditForm dorms={dorms ?? []} fullName={profile.full_name} dormId={profile.dorm_id} block={profile.block} />
      </Card>

      {priv ? (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Telefon</h2>
          <PhoneEditForm phone={priv.phone} nextChangeAt={nextChange} />
        </Card>
      ) : null}

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Hesap</h2>
        <form action={signOut}>
          <SubmitButton variant="secondary" className="w-full" pendingText="Çıkış yapılıyor…">
            <LogOut className="size-5" aria-hidden />
            Çıkış yap
          </SubmitButton>
        </form>
        <Link href="/kvkk" className="min-h-11 py-2 text-sm font-semibold text-accent underline underline-offset-2">
          KVKK aydınlatma metni
        </Link>
      </Card>

      <Card className="flex flex-col gap-3 border-destructive/30">
        <h2 className="text-lg font-bold text-destructive">Hesabımı ve verilerimi sil</h2>
        <DeleteAccountForm />
      </Card>
    </>
  );
}
