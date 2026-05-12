import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';
import { BracketCanvas } from './bracket-canvas';
import { BracketToolbar } from './bracket-toolbar';
import { EmptyBracketState } from './empty-bracket-state';
import { GroupsPanel } from './groups-panel';
import { MatchDetailPanel } from './match-detail-panel';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { GroupData, MatchData } from '@/features/dashboard/types';
import { useAssignSlot, useMatches, useSwapSlots } from '@/queries/matches';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { Skeleton } from '@/components/ui/skeleton';

interface BracketsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

type DragLabel =
  | { kind: 'panel'; name: string }
  | { kind: 'slot'; name: string }
  | null;

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
  const [dragLabel, setDragLabel] = React.useState<DragLabel>(null);

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
    unassignedOnly: false,
    page: 1,
    perPage: 200,
    sorting: [],
  });

  const matches = matchesQuery.data ?? [];
  const athletes = athletesQuery.data?.items ?? [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const assignedRound0TaIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const m of matches) {
      if (m.round !== 0) continue;
      if (m.redTournamentAthleteId) s.add(m.redTournamentAthleteId);
      if (m.blueTournamentAthleteId) s.add(m.blueTournamentAthleteId);
    }
    return s;
  }, [matches]);

  const panelPoolAthletes = React.useMemo(
    () => athletes.filter((a) => !assignedRound0TaIds.has(a.id)),
    [athletes, assignedRound0TaIds]
  );

  const assignSlot = useAssignSlot();
  const swapSlots = useSwapSlots();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } })
  );

  const athleteById = React.useMemo(() => {
    const m = new Map<string, (typeof athletes)[0]>();
    for (const a of athletes) m.set(a.id, a);
    return m;
  }, [athletes]);

  function handleDragStart(e: DragStartEvent) {
    const d = e.active.data.current as
      | { from?: string; tournamentAthleteId?: string }
      | undefined;
    if (!d) return;
    if (d.from === 'panel' && d.tournamentAthleteId) {
      const a = athleteById.get(d.tournamentAthleteId);
      setDragLabel({
        kind: 'panel',
        name: a?.name ?? 'Athlete',
      });
      return;
    }
    if (d.from === 'slot') {
      const taId =
        'tournamentAthleteId' in d && d.tournamentAthleteId
          ? d.tournamentAthleteId
          : null;
      const a = taId ? athleteById.get(taId) : null;
      setDragLabel({ kind: 'slot', name: a?.name ?? 'Athlete' });
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragLabel(null);
    const src = e.active.data.current as
      | {
          from?: string;
          tournamentAthleteId?: string | null;
          groupId?: string;
          matchId?: string;
          side?: 'red' | 'blue';
        }
      | undefined;
    const dst = e.over?.data.current as
      | {
          from?: string;
          groupId?: string | null;
          matchId?: string;
          side?: 'red' | 'blue';
          locked?: boolean;
        }
      | undefined;

    if (!src) return;
    if (e.active.id === e.over?.id) return;

    if (
      src.from === 'panel' &&
      src.tournamentAthleteId &&
      dst?.matchId &&
      dst.side &&
      !dst.locked
    ) {
      void toast.promise(
        assignSlot.mutateAsync({
          matchId: dst.matchId,
          side: dst.side,
          tournamentAthleteId: src.tournamentAthleteId,
        }),
        {
          loading: 'Assigning…',
          success: 'Assigned',
          error: (err) =>
            err instanceof Error ? err.message : 'Assign failed',
        }
      );
      return;
    }

    if (
      src.from === 'slot' &&
      src.matchId &&
      src.side &&
      dst?.from === 'panel-drop' &&
      dst.groupId &&
      src.groupId === dst.groupId
    ) {
      void toast.promise(
        assignSlot.mutateAsync({
          matchId: src.matchId,
          side: src.side,
          tournamentAthleteId: null,
        }),
        {
          loading: 'Removing…',
          success: 'Removed from slot',
          error: (err) =>
            err instanceof Error ? err.message : 'Could not remove',
        }
      );
      return;
    }

    if (
      src.from === 'slot' &&
      src.matchId &&
      src.side &&
      dst?.matchId &&
      dst.side &&
      !dst.locked
    ) {
      void toast.promise(
        swapSlots.mutateAsync({
          matchAId: src.matchId,
          sideA: src.side,
          matchBId: dst.matchId,
          sideB: dst.side,
        }),
        {
          loading: 'Swapping…',
          success: 'Slots swapped',
          error: (err) => (err instanceof Error ? err.message : 'Swap failed'),
        }
      );
    }
  }

  function handleSlotClick(match: MatchData) {
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

  const toolbarDisabled = matches.length === 0;
  const athleteCount = selectedGroup?._count.tournamentAthletes ?? 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 w-full">
        <div className="relative min-h-0 min-w-0 flex-1">
          {matchesQuery.isPending ? (
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : matches.length === 0 ? (
            <EmptyBracketState
              groupId={selectedGroupId}
              readOnly={readOnly}
              tournamentStatus={tournamentStatus}
              athleteCount={athleteCount}
            />
          ) : (
            <BracketCanvas
              matches={matches as Array<MatchData>}
              athletes={athletes}
              thirdPlaceMatch={selectedGroup?.thirdPlaceMatch ?? false}
              onSlotClick={handleSlotClick}
              readOnly={readOnly}
            />
          )}
          <BracketToolbar
            groupId={selectedGroupId}
            disabled={toolbarDisabled}
            readOnly={readOnly}
            tournamentStatus={tournamentStatus}
          />
        </div>

        <GroupsPanel
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          athletes={panelPoolAthletes}
          readOnly={readOnly}
          slotReturnEnabled={matches.length > 0}
          groupAthleteCount={athleteCount}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel ? (
          <div className="bg-popover text-popover-foreground max-w-55 truncate rounded-md border px-3 py-2 text-sm shadow-md">
            {dragLabel.name}
          </div>
        ) : null}
      </DragOverlay>

      <MatchDetailPanel
        match={selectedMatch}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        athletes={athletes}
        readOnly={readOnly}
        tournamentStatus={tournamentStatus}
      />
    </DndContext>
  );
}
