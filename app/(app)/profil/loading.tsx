import { CardSkeleton, FieldSkeleton, Skeleton, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-28" />
      <CardSkeleton>
        <Skeleton className="h-6 w-32" />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardSkeleton>
      <CardSkeleton>
        <Skeleton className="h-6 w-24" />
        <FieldSkeleton />
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardSkeleton>
    </SkeletonPage>
  );
}
