import { Edit } from 'lucide-react';
import { SiteHeader } from '../../site-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const TournamentViewerLoading = () => {
  return (
    <div className="flex h-full flex-col">
      <SiteHeader
        title={
          <span className="text-muted-foreground hover:text-foreground">
            Tournaments
          </span>
        }
        action={<Skeleton className="h-6 w-32" />}
      >
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Button variant="outline" size="sm" disabled>
            <Edit className="mr-1 size-4" />
            Edit Tournament
          </Button>
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-64 rounded-lg lg:col-span-3" />
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
