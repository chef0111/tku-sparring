import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { GripVertical, Plus } from 'lucide-react';
import {
  ArenaDivisionOrderList,
  parseArenaOrderDndId,
} from './arena-division-order-editor';
import { RetireArenaDialog } from './retire-arena-dialog';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { ArenaCrossInsertPreview } from './arena-division-order-editor';
import type { DivisionData } from '@/contracts/tournament/division';
import type { TournamentData } from '@/contracts/tournament/list';
import {
  arenaIndicesForOrderPanel,
  nextArenaSlotToAdd,
  savedArenaDivisionIds,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena/arena-division-order';
import { resolveArenaDivisionOrder } from '@/lib/tournament/arena/match-label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useEnsureArenaSlot,
  useMoveDivisionBetweenArenas,
  useRetireArena,
  useSetArenaDivisionOrder,
  useTournament,
} from '@/queries/tournament';
import { cn } from '@/lib/utils';

interface ArenaDivisionOrdersPanelProps {
  tournamentId: string;
  divisions: Array<DivisionData>;
  readOnly: boolean;
  className?: string;
}

export function ArenaDivisionOrdersPanel({
  tournamentId,
  divisions,
  readOnly,
  className,
}: ArenaDivisionOrdersPanelProps) {
  const tournamentQuery = useTournament(tournamentId);
  const setOrder = useSetArenaDivisionOrder();
  const moveBetween = useMoveDivisionBetweenArenas();
  const ensureSlot = useEnsureArenaSlot();
  const retireArena = useRetireArena();

  const tournament = tournamentQuery.data as TournamentData | undefined;
  const arenaOrderRaw = tournament?.arenaDivisionOrder;
  const isDraft = tournament?.status === 'draft';
  const dndDisabled = readOnly || !isDraft;

  const arenaIndices = React.useMemo(
    () => arenaIndicesForOrderPanel(divisions, arenaOrderRaw),
    [divisions, arenaOrderRaw]
  );

  const nextSlot = React.useMemo(
    () => nextArenaSlotToAdd(divisions, arenaOrderRaw),
    [divisions, arenaOrderRaw]
  );

  const divisionOrderByArena = React.useMemo(() => {
    const m = new Map<number, Array<string>>();
    for (const ai of arenaIndices) {
      const on = divisions.filter((d) => d.arenaIndex === ai);
      const saved = savedArenaDivisionIds(arenaOrderRaw, ai);
      m.set(ai, resolveArenaDivisionOrder(on, saved));
    }
    return m;
  }, [arenaIndices, divisions, arenaOrderRaw]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } })
  );

  const [activeArenaOrderLabel, setActiveArenaOrderLabel] = React.useState<
    string | null
  >(null);
  const [crossArenaDropPreview, setCrossArenaDropPreview] =
    React.useState<ArenaCrossInsertPreview | null>(null);
  const [retireFromArena, setRetireFromArena] = React.useState<number | null>(
    null
  );

  const resetArenaDragUi = React.useCallback(() => {
    setActiveArenaOrderLabel(null);
    setCrossArenaDropPreview(null);
  }, []);

  const handleDragStart = React.useCallback(
    (e: DragStartEvent) => {
      if (dndDisabled) return;
      const d = e.active.data.current as
        | { from?: string; label?: string }
        | undefined;
      if (d?.from === 'arena-order' && typeof d.label === 'string') {
        setActiveArenaOrderLabel(d.label);
      }
      setCrossArenaDropPreview(null);
    },
    [dndDisabled]
  );

  const handleDragOver = React.useCallback(
    (e: DragOverEvent) => {
      if (dndDisabled) return;
      const a = parseArenaOrderDndId(String(e.active.id));
      if (!a || a.kind !== 'row') {
        setCrossArenaDropPreview(null);
        return;
      }
      const overId = e.over?.id;
      if (overId == null) {
        setCrossArenaDropPreview(null);
        return;
      }
      const o = parseArenaOrderDndId(String(overId));
      if (!o) {
        setCrossArenaDropPreview(null);
        return;
      }
      if (a.arenaIndex === o.arenaIndex) {
        setCrossArenaDropPreview(null);
        return;
      }
      if (o.kind === 'tail') {
        setCrossArenaDropPreview({ type: 'append', arenaIndex: o.arenaIndex });
        return;
      }
      setCrossArenaDropPreview({
        type: 'before',
        arenaIndex: o.arenaIndex,
        beforeDivisionId: o.divisionId,
      });
    },
    [dndDisabled]
  );

  const handleDragEnd = React.useCallback(
    (e: DragEndEvent) => {
      resetArenaDragUi();
      if (dndDisabled) return;
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const a = parseArenaOrderDndId(String(active.id));
      if (!a || a.kind !== 'row') return;

      const o = parseArenaOrderDndId(String(over.id));
      if (!o) return;

      let overArena: number;
      let insertIndex: number;

      if (o.kind === 'tail') {
        overArena = o.arenaIndex;
        const destOrder = divisionOrderByArena.get(overArena) ?? [];
        insertIndex = destOrder.length;
      } else {
        overArena = o.arenaIndex;
        const destOrder = divisionOrderByArena.get(overArena) ?? [];
        const idx = destOrder.indexOf(o.divisionId);
        if (idx < 0) return;
        insertIndex = idx;
      }

      if (a.arenaIndex === overArena) {
        const list = [...(divisionOrderByArena.get(overArena) ?? [])];
        const oldIdx = list.indexOf(a.divisionId);
        if (oldIdx < 0) return;
        let newIdx: number;
        if (o.kind === 'tail') {
          newIdx = list.length - 1;
        } else {
          newIdx = list.indexOf(o.divisionId);
        }
        if (newIdx < 0) return;
        if (oldIdx === newIdx) return;
        const next = arrayMove(list, oldIdx, newIdx);
        queueMicrotask(() =>
          setOrder.mutate({
            tournamentId,
            arenaIndex: overArena,
            divisionIds: next,
          })
        );
        return;
      }

      queueMicrotask(() =>
        moveBetween.mutate({
          tournamentId,
          divisionId: a.divisionId,
          fromArena: a.arenaIndex,
          toArena: overArena,
          insertIndex,
        })
      );
    },
    [
      dndDisabled,
      divisionOrderByArena,
      moveBetween,
      resetArenaDragUi,
      setOrder,
      tournamentId,
    ]
  );

  const retireTargetOptions = React.useMemo(() => {
    if (retireFromArena == null) return [];
    return [1, 2, 3].filter((a) => a !== retireFromArena);
  }, [retireFromArena]);

  const divisionCountOnRetireSource =
    retireFromArena == null
      ? 0
      : divisions.filter((d) => d.arenaIndex === retireFromArena).length;

  if (!shouldShowArenaOrderUi(divisions, arenaOrderRaw)) return null;

  if (arenaIndices.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {dndDisabled && (
        <p className="text-muted-foreground text-sm">
          Reorder is available in draft only.
        </p>
      )}
      {!dndDisabled && nextSlot != null ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0"
            disabled={ensureSlot.isPending}
            onClick={() =>
              ensureSlot.mutate({
                tournamentId,
                arenaIndex: nextSlot,
              })
            }
          >
            {ensureSlot.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Adding arena…
              </>
            ) : (
              <>
                <Plus data-icon="inline-start" />
                Add arena {nextSlot}
              </>
            )}
          </Button>
        </div>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetArenaDragUi}
      >
        {arenaIndices.map((arenaIndex) => {
          const divisionsOnArena = divisions.filter(
            (d) => d.arenaIndex === arenaIndex
          );
          const divisionOrder = divisionOrderByArena.get(arenaIndex) ?? [];
          return (
            <ArenaDivisionOrderList
              key={arenaIndex}
              arenaIndex={arenaIndex}
              divisionsOnArena={divisionsOnArena}
              divisionOrder={divisionOrder}
              readOnly={dndDisabled}
              crossArenaDropPreview={crossArenaDropPreview}
              showRetireArena={!dndDisabled}
              onRequestRetire={() => setRetireFromArena(arenaIndex)}
            />
          );
        })}
        <DragOverlay dropAnimation={null}>
          {activeArenaOrderLabel ? (
            <div className="bg-accent dark:bg-background/80 text-foreground flex max-w-[min(100vw,20rem)] cursor-grabbing items-center justify-between gap-2 rounded-md border px-2 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
              <span className="ml-2 truncate text-sm font-medium">
                {activeArenaOrderLabel}
              </span>
              <span className="text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center">
                <GripVertical className="size-4" aria-hidden />
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <RetireArenaDialog
        open={retireFromArena != null}
        onOpenChange={(open) => {
          if (!open) setRetireFromArena(null);
        }}
        fromArena={retireFromArena ?? 1}
        targetArenaOptions={retireTargetOptions}
        divisionCountOnSource={divisionCountOnRetireSource}
        isPending={retireArena.isPending}
        onConfirm={(toArena) => {
          if (retireFromArena == null) return;
          retireArena.mutate(
            {
              tournamentId,
              fromArena: retireFromArena,
              toArena,
            },
            {
              onSuccess: () => setRetireFromArena(null),
            }
          );
        }}
      />
    </div>
  );
}
