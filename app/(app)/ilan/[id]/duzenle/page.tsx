import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing/listing-form";
import { PageTitle } from "@/components/ui/card";
import { updateListing } from "@/lib/actions/listings";
import { requireProfile } from "@/lib/auth";
import { isListingLive } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "İlanı düzenle" };

export default async function EditListingPage({ params }: PageProps<"/ilan/[id]/duzenle">) {
  const profile = await requireProfile();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, owner_id, type, platform, restaurant, description, missing_amount, price_per_person, people_needed, expires_at, status")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!listing) notFound();
  if (!isListingLive(listing)) redirect(`/ilan/${id}`);

  return (
    <>
      <PageTitle title="İlanı düzenle" />
      <ListingForm
        action={updateListing.bind(null, listing.id)}
        submitLabel="Değişiklikleri kaydet"
        defaults={{
          type: listing.type,
          platform: listing.platform,
          restaurant: listing.restaurant,
          description: listing.description ?? "",
          missing_amount: listing.missing_amount?.toString(),
          price_per_person: listing.price_per_person?.toString(),
          people_needed: String(listing.people_needed),
        }}
      />
    </>
  );
}
