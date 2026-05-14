import * as React from 'react';
import { MatchSheetStatus } from '../match-detail-panel/match-sheet-status';
import type { MatchData } from '@/features/dashboard/types';
import { buildBracketActionQueue } from '@/lib/tournament/bracket-action-queue';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface BracketActionQueueProps {
  matches: Array<MatchData>;
  onOpenMatch: (m: MatchData) => void;
  showPanelHint: boolean;
  matchLabel: Map<string, number>;
}

export function BracketActionQueue({
  matches,
  onOpenMatch,
  showPanelHint,
  matchLabel,
}: BracketActionQueueProps) {
  const maxRound = React.useMemo(
    () => Math.max(...matches.map((m) => m.round)),
    [matches]
  );
  const queue = React.useMemo(
    () => buildBracketActionQueue(matches),
    [matches]
  );

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1 px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="bg-primary/80 size-1.5 shrink-0 rounded-full"
            aria-hidden
          />
          <Label className="text-muted-foreground text-sm font-semibold uppercase">
            Available matches
          </Label>
          {queue.length > 0 ? (
            <Badge
              variant="secondary"
              className="ml-auto px-1.5 py-0 font-mono text-[10px]"
            >
              {queue.length}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs leading-snug">
          Open a match to edit scores, slots, or locks.
        </p>
      </header>

      {queue.length === 0 ? (
        <Empty className="border border-dashed py-6">
          <EmptyHeader>
            <EmptyTitle>Nothing queued</EmptyTitle>
            <EmptyDescription>
              No empty slots or missing outcomes right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-0" role="list">
          {queue.map(({ match, reasons }, index) => (
            <QueueRow
              key={match.id}
              match={match}
              reasons={reasons}
              order={index + 1}
              isLast={index === queue.length - 1}
              maxRound={maxRound}
              onOpen={onOpenMatch}
              matchLabel={matchLabel}
            />
          ))}
        </ul>
      )}

      {showPanelHint && (
        <div className="flex flex-col gap-1.5 pt-0.5">
          <Separator />
          <p className="text-muted-foreground px-0.5 text-xs leading-snug">
            Drag from the bracket here to remove an athlete.
          </p>
        </div>
      )}
    </div>
  );
}

interface QueueRowProps {
  match: MatchData;
  reasons: Array<string>;
  maxRound: number;
  order: number;
  isLast: boolean;
  onOpen: (m: MatchData) => void;
  matchLabel: Map<string, number>;
}

function QueueRow({
  match,
  reasons,
  maxRound,
  order,
  isLast,
  onOpen,
  matchLabel,
}: QueueRowProps) {
  const roundLabel = getBracketRoundLabel(match.round, maxRound);

  return (
    <li
      className={cn('relative z-0 flex gap-2', !isLast && 'pb-1.5')}
      role="listitem"
    >
      <div className="relative w-2 shrink-0 translate-y-6 self-stretch">
        <div
          aria-hidden
          className="bg-border absolute top-0 left-1/2 z-0 h-3 w-px -translate-x-1/2"
        />
        <div className="relative z-10 flex justify-center">
          <span
            aria-hidden
            className="bg-primary ring-background size-2 shrink-0 rounded-full ring-2"
          />
        </div>
        {!isLast ? (
          <div
            aria-hidden
            className="bg-border absolute top-3 -bottom-1.5 left-1/2 z-0 w-px -translate-x-1/2"
          />
        ) : null}
      </div>

      <Card
        role="button"
        tabIndex={0}
        aria-label={`${roundLabel} — Match ${match.matchIndex + 1}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(match);
          }
        }}
        className={cn(
          'group bg-popover relative min-w-0 flex-1 gap-0 rounded-md border-none p-0 ring-0',
          'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
        )}
      >
        <div className="bg-popover absolute top-2 right-2 flex size-5 items-center justify-center rounded-sm border border-dashed">
          <span className="text-muted-foreground group-hover:text-foreground text-xs">
            {order}
          </span>
        </div>
        <CardContent
          onClick={() => onOpen(match)}
          className="hover:border-primary/30 bg-muted/30 hover:bg-muted/50 cursor-pointer space-y-2 rounded-md border p-2 transition-colors"
        >
          <CardHeader className="gap-1 p-0">
            <CardTitle className="truncate text-sm font-semibold">
              Match {matchLabel.get(match.id)}
            </CardTitle>
          </CardHeader>
          <p className="text-muted-foreground relative truncate text-xs">
            {reasons.join(' · ')}
          </p>
        </CardContent>
        <CardFooter className="relative flex w-full cursor-default items-center justify-between px-2 py-1">
          <MatchSheetStatus
            status={match.status}
            className="h-4 shrink-0 gap-1 p-1 text-[8px] font-medium tracking-wide uppercase [&>span:last-child]:text-[8px] [&>span:last-child]:leading-none"
          />
          <span
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
            onClick={() => onOpen(match)}
          >
            Open
          </span>
        </CardFooter>
      </Card>
    </li>
  );
}
