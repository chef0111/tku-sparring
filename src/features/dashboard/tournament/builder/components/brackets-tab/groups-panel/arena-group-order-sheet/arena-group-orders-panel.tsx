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
  ArenaGroupOrderList,
  parseArenaOrderDndId,
} from './arena-group-order-editor';
import { RetireArenaDialog } from './retire-arena-dialog';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { ArenaCrossInsertPreview } from './arena-group-order-editor';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import {
  arenaIndicesForOrderPanel,
  nextArenaSlotToAdd,
  savedArenaGroupIds,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena-group-order';
import { resolveArenaGroupOrder } from '@/lib/tournament/arena-match-label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useEnsureArenaSlot,
  useMoveGroupBetweenArenas,
  useRetireArena,
  useSetArenaGroupOrder,
  useTournament,
} from '@/queries/tournaments';
import { cn } from '@/lib/utils';

interface ArenaGroupOrdersPanelProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  className?: string;
}

export function ArenaGroupOrdersPanel({
  tournamentId,
  groups,
  readOnly,
  className,
}: ArenaGroupOrdersPanelProps) {
  const tournamentQuery = useTournament(tournamentId);
  const setOrder = useSetArenaGroupOrder();
  const moveBetween = useMoveGroupBetweenArenas();
  const ensureSlot = useEnsureArenaSlot();
  const retireArena = useRetireArena();

  const tournament = tournamentQuery.data as TournamentData | undefined;
  const arenaOrderRaw = tournament?.arenaGroupOrder;
  const isDraft = tournament?.status === 'draft';
  const dndDisabled = readOnly || !isDraft;

  const arenaIndices = React.useMemo(
    () => arenaIndicesForOrderPanel(groups, arenaOrderRaw),
    [groups, arenaOrderRaw]
  );

  const nextSlot = React.useMemo(
    () => nextArenaSlotToAdd(groups, arenaOrderRaw),
    [groups, arenaOrderRaw]
  );

  const groupOrderByArena = React.useMemo(() => {
    const m = new Map<number, Array<string>>();
    for (const ai of arenaIndices) {
      const on = groups.filter((g) => g.arenaIndex === ai);
      const saved = savedArenaGroupIds(arenaOrderRaw, ai);
      m.set(ai, resolveArenaGroupOrder(on, saved));
    }
    return m;
  }, [arenaIndices, groups, arenaOrderRaw]);

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
        beforeGroupId: o.groupId,
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
        const destOrder = groupOrderByArena.get(overArena) ?? [];
        insertIndex = destOrder.length;
      } else {
        overArena = o.arenaIndex;
        const destOrder = groupOrderByArena.get(overArena) ?? [];
        const idx = destOrder.indexOf(o.groupId);
        if (idx < 0) return;
        insertIndex = idx;
      }

      if (a.arenaIndex === overArena) {
        const list = [...(groupOrderByArena.get(overArena) ?? [])];
        const oldIdx = list.indexOf(a.groupId);
        if (oldIdx < 0) return;
        let newIdx: number;
        if (o.kind === 'tail') {
          newIdx = list.length - 1;
        } else {
          newIdx = list.indexOf(o.groupId);
        }
        if (newIdx < 0) return;
        if (oldIdx === newIdx) return;
        const next = arrayMove(list, oldIdx, newIdx);
        queueMicrotask(() =>
          setOrder.mutate({
            tournamentId,
            arenaIndex: overArena,
            groupIds: next,
          })
        );
        return;
      }

      queueMicrotask(() =>
        moveBetween.mutate({
          tournamentId,
          groupId: a.groupId,
          fromArena: a.arenaIndex,
          toArena: overArena,
          insertIndex,
        })
      );
    },
    [
      dndDisabled,
      groupOrderByArena,
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

  const groupCountOnRetireSource =
    retireFromArena == null
      ? 0
      : groups.filter((g) => g.arenaIndex === retireFromArena).length;

  if (!shouldShowArenaOrderUi(groups, arenaOrderRaw)) return null;

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
          const groupsOnArena = groups.filter(
            (g) => g.arenaIndex === arenaIndex
          );
          const groupOrder = groupOrderByArena.get(arenaIndex) ?? [];
          return (
            <ArenaGroupOrderList
              key={arenaIndex}
              arenaIndex={arenaIndex}
              groupsOnArena={groupsOnArena}
              groupOrder={groupOrder}
              readOnly={dndDisabled}
              crossArenaDropPreview={crossArenaDropPreview}
              showRetireArena={!dndDisabled}
              onRequestRetire={() => setRetireFromArena(arenaIndex)}
            />
          );
        })}
        <DragOverlay dropAnimation={null}>
          {activeArenaOrderLabel ? (
            <div className="bg-background text-foreground flex max-w-[min(100vw,20rem)] cursor-grabbing items-center justify-between gap-2 rounded-md border px-2 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
              <span className="truncate text-sm font-medium">
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
        groupCountOnSource={groupCountOnRetireSource}
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
