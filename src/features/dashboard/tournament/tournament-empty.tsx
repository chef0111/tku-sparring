import { Plus, Trophy } from 'lucide-react';
import { CreateTournamentDialog } from './create-tournament-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TournamentEmpty = () => {
  return (
    <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Trophy className="text-muted-foreground mb-4 size-12" />
      <h3 className="text-lg font-semibold">No tournaments yet</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Create your first tournament to get started.
      </p>
      <CreateTournamentDialog>
        <Button variant="outline">
          <Plus className="size-4" />
          Create Tournament
        </Button>
      </CreateTournamentDialog>
    </Card>
  );
};
