import { RowsSkeleton, Skeleton, SkeletonPage, StatTilesSkeleton, TitleSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <TitleSkeleton />
      <StatTilesSkeleton count={7} />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-44" />
          <RowsSkeleton rows={4} />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <RowsSkeleton rows={4} />
        </div>
      </div>
    </SkeletonPage>
  );
}
