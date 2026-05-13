import { Dices } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateBracket } from '@/queries/matches';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
      <Empty className="h-full border-none py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Dices />
          </EmptyMedia>
          <EmptyTitle>No bracket yet</EmptyTitle>
          <EmptyDescription>
            No bracket has been generated for this group.
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
      </EmptyContent>
    </Empty>
  );
}
