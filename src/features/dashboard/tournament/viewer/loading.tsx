import { Edit } from 'lucide-react';
import { SiteHeader } from '../../site-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
          <Button variant="outline" size="sm">
            <Edit className="mr-1 size-4" />
            Edit Tournament
          </Button>
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mt-36 flex w-full flex-col items-center justify-center">
          <Spinner />
          <p className="text-muted-foreground mt-4 text-lg font-semibold">
            Loading tournament...
          </p>
        </div>
      </div>
    </div>
  );
};
