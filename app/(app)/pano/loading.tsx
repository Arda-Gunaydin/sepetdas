import { ChipRowSkeleton, ListingCardSkeleton, SkeletonPage, TitleSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <TitleSkeleton withAction />
      <ChipRowSkeleton count={4} />
      <ChipRowSkeleton count={4} />
      <div className="flex flex-col gap-3">
        <ListingCardSkeleton />
        <ListingCardSkeleton />
        <ListingCardSkeleton />
      </div>
    </SkeletonPage>
  );
}
