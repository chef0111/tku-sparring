import { Dices } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateBracket } from '@/queries/match';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

interface EmptyBracketStateProps {
  divisionId: string | null;
  readOnly: boolean;
  tournamentStatus: string;
  athleteCount: number;
}

export function EmptyBracketState({
  divisionId,
  readOnly,
  tournamentStatus,
  athleteCount,
}: EmptyBracketStateProps) {
  const generate = useGenerateBracket();

  const hidden = readOnly || tournamentStatus !== 'draft';
  if (hidden) {
    return (
      <Empty className="h-full border-none py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Dices />
          </EmptyMedia>
          <EmptyTitle>No bracket yet</EmptyTitle>
          <EmptyDescription>
            No bracket has been generated for this division.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty className="h-full border-none py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Dices />
        </EmptyMedia>
        <EmptyTitle>No bracket yet</EmptyTitle>
        <EmptyDescription>
          Creates an empty shell sized to your {athleteCount} athletes. Use
          Shuffle in the toolbar to populate.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          disabled={!divisionId || generate.isPending || athleteCount < 2}
          onClick={() => {
            if (!divisionId) return;
            void toast.promise(generate.mutateAsync({ divisionId }), {
              loading: 'Generating shell…',
              success: 'Bracket shell created',
              error: (e) =>
                e instanceof Error ? e.message : 'Could not generate',
            });
          }}
        >
          {generate.isPending ? (
            <>
              <Spinner />
              Generating…
            </>
          ) : (
            <>
              <Dices data-icon="inline-start" />
              Generate Bracket
            </>
          )}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
