import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TournamentCardSkeleton() {
  return (
    <Card className="relative gap-0 rounded-md border p-4">
      <Skeleton className="absolute top-4 right-4 size-8" />
      <CardContent className="space-y-4 p-0">
        <CardHeader className="gap-2 p-0">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </CardHeader>
        <Skeleton className="h-4 w-48" />
        <CardFooter className="flex items-center justify-between p-0">
          <Skeleton className="h-5 w-18 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </CardFooter>
      </CardContent>
    </Card>
  );
}
