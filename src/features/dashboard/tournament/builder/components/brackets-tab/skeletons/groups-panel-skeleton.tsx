import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function QueueRowSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <li
      className={cn('relative z-0 flex gap-2', !isLast && 'pb-1.5')}
      aria-hidden
    >
      <div
        className="flex w-3 shrink-0 translate-y-6 flex-col items-center"
        aria-hidden
      >
        <Skeleton className="size-1.5 shrink-0 rounded-full" />
        {!isLast && (
          <div className="bg-border mt-1 h-full min-h-3 w-px flex-1 rounded-none" />
        )}
      </div>

      <div className="bg-popover relative min-w-0 flex-1 gap-0 rounded-md border-none p-0">
        <div className="bg-popover absolute top-2 right-2 flex size-5 items-center justify-center rounded-sm border border-dashed">
          <Skeleton className="size-3 rounded-sm" />
        </div>
        <div className="bg-muted/30 space-y-4 rounded-md border p-2">
          <div className="p-0">
            <Skeleton className="h-4 w-full max-w-48" />
          </div>
          <Skeleton className="h-3 w-full max-w-40" />
        </div>
        <div className="relative flex w-full items-center justify-between px-2 py-1">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </li>
  );
}

export function GroupsPanelSkeleton({
  rowCount = 4,
  showPanelHint = false,
}: {
  rowCount?: number;
  showPanelHint?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <header className="flex flex-col gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-1.5 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto size-5 rounded-md" />
        </div>
        <Skeleton className="h-3 w-full max-w-64" />
      </header>

      <ul className="flex flex-col gap-0" role="presentation">
        {Array.from({ length: rowCount }).map((_, index) => (
          <QueueRowSkeleton key={index} isLast={index === rowCount - 1} />
        ))}
      </ul>

      {showPanelHint && (
        <div className="flex flex-col gap-1.5 pt-0.5">
          <Separator />
          <Skeleton className="h-3 w-full max-w-72" />
        </div>
      )}
    </div>
  );
}
