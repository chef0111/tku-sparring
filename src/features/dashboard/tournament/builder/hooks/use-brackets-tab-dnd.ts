import * as React from 'react';
import { MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toast } from 'sonner';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { TournamentAthleteData } from '@/features/dashboard/types';
import { useAssignSlot, useSwapSlots } from '@/queries/matches';

type DragLabel =
  | { kind: 'panel'; name: string }
  | { kind: 'slot'; name: string }
  | null;

function dndErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useBracketsTabDnd(athletes: Array<TournamentAthleteData>) {
  const [dragLabel, setDragLabel] = React.useState<DragLabel>(null);

  const assignSlot = useAssignSlot();
  const swapSlots = useSwapSlots();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } })
  );

  const athleteById = React.useMemo(() => {
    const m = new Map<string, TournamentAthleteData>();
    for (const a of athletes) m.set(a.id, a);
    return m;
  }, [athletes]);

  const onDragStart = React.useCallback(
    (e: DragStartEvent) => {
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
    },
    [athleteById]
  );

  const onDragEnd = React.useCallback(
    (e: DragEndEvent) => {
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
      if (src.from === 'arena-order' || src.from === 'arena-order-tail') return;

      if (
        src.from === 'panel' &&
        src.tournamentAthleteId &&
        dst?.matchId &&
        dst.side &&
        !dst.locked
      ) {
        assignSlot.mutate(
          {
            matchId: dst.matchId,
            side: dst.side,
            tournamentAthleteId: src.tournamentAthleteId,
          },
          {
            onError: (err) =>
              toast.error(dndErrorMessage(err, 'Assign failed')),
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
        assignSlot.mutate(
          {
            matchId: src.matchId,
            side: src.side,
            tournamentAthleteId: null,
          },
          {
            onError: (err) =>
              toast.error(dndErrorMessage(err, 'Could not remove')),
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
        swapSlots.mutate(
          {
            matchAId: src.matchId,
            sideA: src.side,
            matchBId: dst.matchId,
            sideB: dst.side,
          },
          {
            onError: (err) => toast.error(dndErrorMessage(err, 'Swap failed')),
          }
        );
      }
    },
    [assignSlot, swapSlots]
  );

  return { sensors, dragLabel, onDragStart, onDragEnd };
}

export type BracketsTabDndSnapshot = ReturnType<typeof useBracketsTabDnd>;
