import * as React from 'react';
import { ListIcon } from 'lucide-react';
import type { MatchData } from '@/features/dashboard/types';
import { buildBracketActionQueue } from '@/lib/tournament/bracket-action-queue';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export function BracketActionQueueSection({
  matches,
  onOpenMatch,
  showPanelHint,
}: {
  matches: Array<MatchData>;
  onOpenMatch: (m: MatchData) => void;
  showPanelHint: boolean;
}) {
  const maxRound = React.useMemo(
    () => Math.max(...matches.map((m) => m.round)),
    [matches]
  );
  const queue = React.useMemo(
    () => buildBracketActionQueue(matches),
    [matches]
  );

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-1 px-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Needs attention
        </p>
        <p className="text-muted-foreground text-xs">
          Open a match to edit scores, slots, or locks.
        </p>
      </div>
      {queue.length === 0 ? (
        <Empty className="border border-dashed py-8">
          <EmptyHeader>
            <EmptyTitle>Nothing queued</EmptyTitle>
            <EmptyDescription>
              No empty slots or missing outcomes right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1.5" role="list">
          {queue.map(({ match, reasons }) => {
            const title = `${getBracketRoundLabel(match.round, maxRound)} — Match ${match.matchIndex + 1}`;
            return (
              <li key={match.id} className="flex gap-2" role="listitem">
                <div
                  className="text-muted-foreground pointer-events-none flex shrink-0 pt-3"
                  aria-hidden
                >
                  <ListIcon className="size-4" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-w-0 flex-1 flex-col items-start gap-1 py-2.5 whitespace-normal"
                  onClick={() => onOpenMatch(match)}
                >
                  <span className="text-foreground text-left text-sm font-medium">
                    {title}
                  </span>
                  <span className="text-muted-foreground text-left text-xs">
                    {reasons.join(' · ')}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {showPanelHint ? (
        <p className="text-muted-foreground border-t pt-2 text-xs">
          Drag from the bracket here to remove an athlete.
        </p>
      ) : null}
    </div>
  );
}
