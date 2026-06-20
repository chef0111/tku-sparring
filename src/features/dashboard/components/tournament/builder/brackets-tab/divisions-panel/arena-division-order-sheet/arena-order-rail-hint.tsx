import type { DivisionData } from '@/contracts/tournament/division';
import {
  arenaIndicesForOrderPanel,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena/arena-division-order';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArenaOrderRailHintProps {
  divisions: Array<DivisionData>;
  /** Tournament `arenaDivisionOrder` JSON; used to show reserved empty arena slots. */
  arenaDivisionOrder?: unknown;
  isDraft: boolean;
  readOnly: boolean;
  onEdit: () => void;
}

export function ArenaOrderRailHint({
  divisions,
  arenaDivisionOrder,
  isDraft,
  readOnly,
  onEdit,
}: ArenaOrderRailHintProps) {
  if (!shouldShowArenaOrderUi(divisions, arenaDivisionOrder)) return null;

  const arenaIndices = arenaIndicesForOrderPanel(divisions, arenaDivisionOrder);
  const summary = arenaIndices
    .map((ai) => {
      const n = divisions.filter((d) => d.arenaIndex === ai).length;
      return `Arena ${ai} (${n})`;
    })
    .join(' · ');

  const canEdit = isDraft && !readOnly;

  return (
    <div
      className={cn(
        'border-border flex shrink-0 flex-col gap-1.5 border-b px-2 py-2'
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Arena order
      </p>
      <p className="text-muted-foreground truncate text-xs" title={summary}>
        {summary}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full shrink-0"
        disabled={!canEdit}
        onClick={onEdit}
      >
        Edit order
      </Button>
      {!canEdit && (
        <p className="text-muted-foreground text-[11px] leading-snug">
          {readOnly
            ? 'Read-only workspace.'
            : 'Switch tournament to draft to edit arena order.'}
        </p>
      )}
    </div>
  );
}
