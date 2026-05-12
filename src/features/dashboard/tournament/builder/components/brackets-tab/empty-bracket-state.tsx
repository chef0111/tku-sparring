import * as React from 'react';
import { Dices } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateBracket } from '@/queries/matches';
import { Button } from '@/components/ui/button';

interface EmptyBracketStateProps {
  groupId: string | null;
  readOnly: boolean;
  tournamentStatus: string;
  athleteCount: number;
}

export function EmptyBracketState({
  groupId,
  readOnly,
  tournamentStatus,
  athleteCount,
}: EmptyBracketStateProps) {
  const generate = useGenerateBracket();

  const hidden = readOnly || tournamentStatus !== 'draft';
  if (hidden) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <Dices className="text-muted-foreground size-7" />
        </div>
        <h3 className="font-semibold">No bracket yet</h3>
        <p className="text-muted-foreground max-w-xs text-center text-sm">
          No bracket has been generated for this group.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <Dices className="text-muted-foreground size-7" />
      </div>
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h3 className="font-semibold">No bracket yet</h3>
        <p className="text-muted-foreground text-sm">
          Creates an empty shell sized to your {athleteCount} athletes. Use
          Shuffle in the toolbar to populate.
        </p>
      </div>
      <Button
        disabled={!groupId || generate.isPending || athleteCount < 2}
        onClick={() => {
          if (!groupId) return;
          void toast.promise(generate.mutateAsync({ groupId }), {
            loading: 'Generating shell…',
            success: 'Bracket shell created',
            error: (e) =>
              e instanceof Error ? e.message : 'Could not generate',
          });
        }}
      >
        <Dices data-icon="inline-start" />
        Generate Bracket
      </Button>
    </div>
  );
}
