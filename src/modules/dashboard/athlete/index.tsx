import { Plus } from 'lucide-react';
import { Header } from '../header';
import { AthletesTable } from '../components/athletes/athletes-table';
import { Button } from '@/components/ui/button';
import { FeatureFlagsProvider } from '@/contexts/feature-flags';

export function AthletePage() {
  return (
    <div className="flex h-full w-full flex-col">
      <Header title="Athletes" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Athletes Manager
            </h2>
            <p className="text-muted-foreground">
              Manage your athletes across all tournaments
            </p>
          </div>
          <Button>
            <Plus className="size-4" />
            Add Athletes
          </Button>
        </div>

        <FeatureFlagsProvider>
          <AthletesTable />
        </FeatureFlagsProvider>
      </div>
    </div>
  );
}
