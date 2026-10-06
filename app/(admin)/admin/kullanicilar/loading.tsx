import { RowsSkeleton, Skeleton, SkeletonPage, TitleSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <TitleSkeleton />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl sm:w-28" />
      </div>
      <RowsSkeleton rows={8} />
    </SkeletonPage>
  );
}
