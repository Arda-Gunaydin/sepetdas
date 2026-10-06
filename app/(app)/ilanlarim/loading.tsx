import { ListingCardSkeleton, Skeleton, SkeletonPage, TitleSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <TitleSkeleton />
      <Skeleton className="h-6 w-28" />
      <div className="flex flex-col gap-2">
        <ListingCardSkeleton />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
