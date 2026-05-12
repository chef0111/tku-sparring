import * as React from 'react';
import { Dices, RefreshCw, Shuffle, Trophy } from 'lucide-react';
import { BracketCanvas } from './bracket-canvas';
import { MatchDetailPanel } from './match-detail-panel';
import type { GroupData, MatchData } from '@/features/dashboard/types';
import {
  useGenerateBracket,
  useMatches,
  useRegenerateBracket,
  useShuffleBracket,
} from '@/queries/matches';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BracketsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

export function BracketsTab({
  tournamentId,
  groups,
  readOnly,
  tournamentStatus,
}: BracketsTabProps) {
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    groups[0]?.id ?? null
  );
  const [selectedMatch, setSelectedMatch] = React.useState<MatchData | null>(
    null
  );
  const [panelOpen, setPanelOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]!.id);
    }
    if (selectedGroupId && !groups.find((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0]?.id ?? null);
    }
  }, [groups, selectedGroupId]);

  const matchesQuery = useMatches(selectedGroupId);
  const athletesQuery = useTournamentAthletes({
    tournamentId,
    groupId: selectedGroupId ?? undefined,
  });

  const matches = matchesQuery.data ?? [];
  const athletes = athletesQuery.data ?? [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const generateBracket = useGenerateBracket();
  const shuffleBracket = useShuffleBracket();
  const regenerateBracket = useRegenerateBracket();

  function handleMatchClick(match: MatchData) {
    setSelectedMatch(match);
    setPanelOpen(true);
  }

  if (groups.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <Trophy className="text-muted-foreground size-8" />
        </div>
        <h3 className="text-lg font-semibold">No groups yet</h3>
        <p className="text-muted-foreground max-w-xs text-center text-sm">
          Create groups and assign athletes before generating brackets.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Group selector bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                group.id === selectedGroupId
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {group.name}
              <span
                className={cn(
                  'text-xs tabular-nums',
                  group.id === selectedGroupId
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                ({group._count.tournamentAthletes})
              </span>
            </button>
          ))}
        </div>

        {/* Bracket actions */}
        {selectedGroupId && !readOnly && (
          <div className="ml-auto flex gap-1.5">
            {matches.length === 0 ? (
              <Button
                size="sm"
                onClick={() =>
                  generateBracket.mutate({ groupId: selectedGroupId })
                }
                disabled={
                  generateBracket.isPending ||
                  (selectedGroup?._count.tournamentAthletes ?? 0) < 2
                }
              >
                <Dices className="mr-1 size-3.5" />
                Generate Bracket
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    shuffleBracket.mutate({ groupId: selectedGroupId })
                  }
                  disabled={shuffleBracket.isPending}
                >
                  <Shuffle className="mr-1 size-3.5" />
                  Shuffle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    regenerateBracket.mutate({ groupId: selectedGroupId })
                  }
                  disabled={regenerateBracket.isPending}
                >
                  <RefreshCw className="mr-1 size-3.5" />
                  Regenerate
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden">
        {matchesQuery.isPending ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="bg-muted flex size-14 items-center justify-center rounded-full">
              <Dices className="text-muted-foreground size-7" />
            </div>
            <h3 className="font-semibold">No bracket yet</h3>
            <p className="text-muted-foreground max-w-xs text-center text-sm">
              {readOnly
                ? 'No bracket has been generated for this group.'
                : 'Generate a bracket to visualize matches for this group.'}
            </p>
          </div>
        ) : (
          <BracketCanvas
            matches={matches as Array<MatchData>}
            athletes={athletes}
            thirdPlaceMatch={selectedGroup?.thirdPlaceMatch ?? false}
            onMatchClick={handleMatchClick}
          />
        )}
      </div>

      {/* Match detail panel */}
      <MatchDetailPanel
        match={selectedMatch}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        athletes={athletes}
        readOnly={readOnly}
        tournamentStatus={tournamentStatus}
      />
    </div>
  );
}
