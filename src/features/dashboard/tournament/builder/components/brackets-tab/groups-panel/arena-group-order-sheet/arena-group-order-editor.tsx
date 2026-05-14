import * as React from 'react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, MinusIcon } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/** Live insert position when dragging a group from another arena. */
export type ArenaCrossInsertPreview =
  | { type: 'before'; arenaIndex: number; beforeGroupId: string }
  | { type: 'append'; arenaIndex: number };

function CrossArenaDropIndicator() {
  return (
    <li className="pointer-events-none list-none py-0.5" aria-hidden>
      <div className="bg-primary shadow-primary/25 ring-primary/40 h-0.5 w-full rounded-full shadow-sm ring-1" />
    </li>
  );
}

const ARENA_ORDER_PREFIX = 'arena-order:';

export function arenaOrderSortableId(
  arenaIndex: number,
  groupId: string
): string {
  return `${ARENA_ORDER_PREFIX}${arenaIndex}:${groupId}`;
}

export function arenaOrderTailDroppableId(arenaIndex: number): string {
  return `arena-order-tail:${arenaIndex}`;
}

export function parseArenaOrderDndId(
  id: string
):
  | { kind: 'row'; arenaIndex: number; groupId: string }
  | { kind: 'tail'; arenaIndex: number }
  | null {
  const s = String(id);
  if (s.startsWith('arena-order-tail:')) {
    const arenaIndex = Number(s.slice('arena-order-tail:'.length));
    if (!Number.isFinite(arenaIndex) || arenaIndex < 1) return null;
    return { kind: 'tail', arenaIndex };
  }
  if (!s.startsWith(ARENA_ORDER_PREFIX)) return null;
  const rest = s.slice(ARENA_ORDER_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon <= 0) return null;
  const arenaIndex = Number(rest.slice(0, colon));
  const groupId = rest.slice(colon + 1);
  if (!Number.isFinite(arenaIndex) || arenaIndex < 1 || !groupId) return null;
  return { kind: 'row', arenaIndex, groupId };
}

function SortableArenaGroupRow({
  arenaIndex,
  groupId,
  label,
  readOnly,
}: {
  arenaIndex: number;
  groupId: string;
  label: string;
  readOnly: boolean;
}) {
  const id = arenaOrderSortableId(arenaIndex, groupId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: readOnly,
    data: {
      from: 'arena-order' as const,
      arenaIndex,
      groupId,
      label,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
    zIndex: isDragging ? 1 : undefined,
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-accent dark:bg-background/80 flex items-center justify-between gap-2 rounded-md border px-2 py-1',
        isDragging && 'shadow-md'
      )}
    >
      <span className="truncate text-sm">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground size-7 shrink-0 cursor-grab touch-none data-dragging:cursor-grabbing"
        disabled={readOnly}
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical data-icon="inline-start" />
      </Button>
    </li>
  );
}

function ArenaListDropTail({
  arenaIndex,
  readOnly,
  highlightAsAppendTarget,
}: {
  arenaIndex: number;
  readOnly: boolean;
  highlightAsAppendTarget?: boolean;
}) {
  const id = arenaOrderTailDroppableId(arenaIndex);
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: readOnly,
    data: {
      from: 'arena-order-tail' as const,
      arenaIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-popover mt-1 min-h-8 shrink-0 rounded-md border border-dashed',
        (isOver || highlightAsAppendTarget) &&
          !readOnly &&
          'bg-primary/10 border-primary/40'
      )}
      aria-hidden
    />
  );
}

interface ArenaGroupOrderListProps {
  arenaIndex: number;
  groupsOnArena: Array<GroupData>;
  groupOrder: Array<string>;
  readOnly: boolean;
  crossArenaDropPreview?: ArenaCrossInsertPreview | null;
  showRetireArena?: boolean;
  onRequestRetire?: () => void;
}

export function ArenaGroupOrderList({
  arenaIndex,
  groupsOnArena,
  groupOrder,
  readOnly,
  crossArenaDropPreview = null,
  showRetireArena = false,
  onRequestRetire,
}: ArenaGroupOrderListProps) {
  const sortableIds = groupOrder.map((gid) =>
    arenaOrderSortableId(arenaIndex, gid)
  );

  const appendHere =
    crossArenaDropPreview?.type === 'append' &&
    crossArenaDropPreview.arenaIndex === arenaIndex;

  return (
    <div className="border-border bg-muted/30 rounded-md border px-2 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className="text-muted-foreground mx-1 text-xs font-semibold tracking-wide uppercase">
          <MapPin className="size-3.5" />
          Arena {arenaIndex}
        </Label>
        {showRetireArena && onRequestRetire ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Remove arena"
            className="text-muted-foreground h-7 shrink-0 px-2 text-xs"
            onClick={onRequestRetire}
          >
            <MinusIcon />
          </Button>
        ) : null}
      </div>
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-1">
          {groupOrder.map((gid) => {
            const g = groupsOnArena.find((x) => x.id === gid);
            const label = g?.name ?? gid;
            const showInsertBefore =
              crossArenaDropPreview?.type === 'before' &&
              crossArenaDropPreview.arenaIndex === arenaIndex &&
              crossArenaDropPreview.beforeGroupId === gid;
            return (
              <React.Fragment key={gid}>
                {showInsertBefore ? <CrossArenaDropIndicator /> : null}
                <SortableArenaGroupRow
                  arenaIndex={arenaIndex}
                  groupId={gid}
                  label={label}
                  readOnly={readOnly}
                />
              </React.Fragment>
            );
          })}
        </ul>
      </SortableContext>
      <ArenaListDropTail
        arenaIndex={arenaIndex}
        readOnly={readOnly}
        highlightAsAppendTarget={appendHere}
      />
    </div>
  );
}
