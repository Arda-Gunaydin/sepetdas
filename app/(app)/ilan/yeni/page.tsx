import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/listing/listing-form";
import { PageTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { createListing } from "@/lib/actions/listings";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "İlan aç" };

export default async function NewListingPage() {
  const profile = await requireProfile();

  if (profile.status !== "active") {
    return (
      <>
        <PageTitle title="İlan aç" />
        <Notice tone="warning">Hesabın askıda olduğu için şu an ilan açamazsın.</Notice>
      </>
    );
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", profile.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  return (
    <>
      <PageTitle title="İlan aç" description={`${profile.dorm?.name ?? "Yurdundaki"} öğrenciler görecek.`} />
      {(count ?? 0) >= 2 ? (
        <Notice tone="warning" title="2 aktif ilanın var">
          Aynı anda en fazla 2 aktif ilan açabilirsin.{" "}
          <Link href="/ilanlarim" className="font-semibold underline underline-offset-2">
            İlanlarım
          </Link>{" "}
          sayfasından birini kapatabilirsin.
        </Notice>
      ) : (
        <ListingForm action={createListing} defaults={{}} submitLabel="İlanı yayınla" />
      )}
    </>
  );
}
