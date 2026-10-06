import { ChipRowSkeleton, Skeleton, SkeletonPage, TitleSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <TitleSkeleton />
      <ChipRowSkeleton count={3} />
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
