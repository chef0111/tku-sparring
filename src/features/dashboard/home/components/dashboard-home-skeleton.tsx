import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';

function PipelineColumnSkeleton() {
  return (
    <>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="size-5 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-21/9 rounded-lg sm:min-h-30" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="min-h-70 rounded-xl" />
        ))}
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 lg:grid lg:snap-none lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            size="sm"
            className="min-h-80 w-[85vw] shrink-0 snap-center lg:w-auto"
          >
            <PipelineColumnSkeleton />
          </Card>
        ))}
      </div>
      <DataTableSkeleton columnCount={6} withViewOptions={false} rowCount={5} />
    </div>
  );
}
