import * as React from 'react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, MinusIcon } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/** Live insert position when dragging a division from another arena. */
export type ArenaCrossInsertPreview =
  | { type: 'before'; arenaIndex: number; beforeDivisionId: string }
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
  divisionId: string
): string {
  return `${ARENA_ORDER_PREFIX}${arenaIndex}:${divisionId}`;
}

export function arenaOrderTailDroppableId(arenaIndex: number): string {
  return `arena-order-tail:${arenaIndex}`;
}

export function parseArenaOrderDndId(
  id: string
):
  | { kind: 'row'; arenaIndex: number; divisionId: string }
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
  const divisionId = rest.slice(colon + 1);
  if (!Number.isFinite(arenaIndex) || arenaIndex < 1 || !divisionId)
    return null;
  return { kind: 'row', arenaIndex, divisionId };
}

function SortableArenaDivisionRow({
  arenaIndex,
  divisionId,
  label,
  readOnly,
}: {
  arenaIndex: number;
  divisionId: string;
  label: string;
  readOnly: boolean;
}) {
  const id = arenaOrderSortableId(arenaIndex, divisionId);
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
      divisionId,
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
      <span className="ml-2 truncate text-sm">{label}</span>
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

interface ArenaDivisionOrderListProps {
  arenaIndex: number;
  divisionsOnArena: Array<DivisionData>;
  divisionOrder: Array<string>;
  readOnly: boolean;
  crossArenaDropPreview?: ArenaCrossInsertPreview | null;
  showRetireArena?: boolean;
  onRequestRetire?: () => void;
}

export function ArenaDivisionOrderList({
  arenaIndex,
  divisionsOnArena,
  divisionOrder,
  readOnly,
  crossArenaDropPreview = null,
  showRetireArena = false,
  onRequestRetire,
}: ArenaDivisionOrderListProps) {
  const sortableIds = divisionOrder.map((did) =>
    arenaOrderSortableId(arenaIndex, did)
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
          {divisionOrder.map((did) => {
            const d = divisionsOnArena.find((x) => x.id === did);
            const label = d?.name ?? did;
            const showInsertBefore =
              crossArenaDropPreview?.type === 'before' &&
              crossArenaDropPreview.arenaIndex === arenaIndex &&
              crossArenaDropPreview.beforeDivisionId === did;
            return (
              <React.Fragment key={did}>
                {showInsertBefore ? <CrossArenaDropIndicator /> : null}
                <SortableArenaDivisionRow
                  arenaIndex={arenaIndex}
                  divisionId={did}
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
