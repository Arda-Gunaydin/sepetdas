import { CardSkeleton, Skeleton, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-6 w-20" />
      <CardSkeleton>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/5" />
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </CardSkeleton>
      <CardSkeleton>
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="mx-auto h-4 w-56" />
      </CardSkeleton>
    </SkeletonPage>
  );
}
