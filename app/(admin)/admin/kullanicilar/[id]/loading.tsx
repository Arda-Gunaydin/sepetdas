import { CardSkeleton, Skeleton, SkeletonPage, StatTilesSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-6 w-28" />
      <CardSkeleton>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      </CardSkeleton>
      <StatTilesSkeleton count={5} className="md:grid-cols-5" />
      <Skeleton className="h-6 w-36" />
      <div className="grid gap-2 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
