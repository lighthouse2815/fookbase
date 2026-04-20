import type { FriendsSkeletonBoxProps } from './interface';

const SkeletonBox = ({ className }: FriendsSkeletonBoxProps) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 ${className}`} />
);

export const FriendsPageSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/75">
        <SkeletonBox className="mb-3 h-8 w-32" />
        <div className="space-y-2">
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-12 w-full" />
        </div>
      </aside>

      <section className="space-y-4">
        <SkeletonBox className="h-16 w-full" />
        <SkeletonBox className="h-52 w-full" />
        <SkeletonBox className="h-52 w-full" />
      </section>

      <aside className="hidden rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/75 xl:block">
        <SkeletonBox className="h-24 w-full" />
        <SkeletonBox className="mt-4 h-20 w-full" />
        <SkeletonBox className="mt-4 h-40 w-full" />
      </aside>
    </div>
  );
};

