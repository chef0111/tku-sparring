import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TournamentCardSkeleton() {
  return (
    <Card className="bg-muted dark:bg-popover/70 relative gap-0 rounded-lg border-none p-0 ring-0">
      <Skeleton className="absolute top-4 right-4 size-8" />
      <CardContent className="bg-card flex flex-col justify-between gap-0 rounded-lg border p-4 max-sm:space-y-5 sm:aspect-21/9">
        <CardHeader className="gap-2 p-0">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-24" />
        </CardHeader>
        <Skeleton className="h-3.5 w-48" />
      </CardContent>
      <CardFooter className="flex items-center justify-between p-2">
        <Skeleton className="h-5 w-18 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </CardFooter>
    </Card>
  );
}
