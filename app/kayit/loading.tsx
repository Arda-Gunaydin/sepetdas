import { FieldSkeleton, Skeleton, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6 pb-10">
      <SkeletonPage>
        <Skeleton className="h-9 w-36 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full" />
        </div>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </SkeletonPage>
    </main>
  );
}
