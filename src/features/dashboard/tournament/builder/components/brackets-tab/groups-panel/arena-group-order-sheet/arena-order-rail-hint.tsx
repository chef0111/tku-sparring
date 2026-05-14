import type { GroupData } from '@/features/dashboard/types';
import {
  arenaIndicesForOrderPanel,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena-group-order';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArenaOrderRailHintProps {
  groups: Array<GroupData>;
  /** Tournament `arenaGroupOrder` JSON; used to show reserved empty arena slots. */
  arenaGroupOrder?: unknown;
  isDraft: boolean;
  readOnly: boolean;
  onEdit: () => void;
}

export function ArenaOrderRailHint({
  groups,
  arenaGroupOrder,
  isDraft,
  readOnly,
  onEdit,
}: ArenaOrderRailHintProps) {
  if (!shouldShowArenaOrderUi(groups, arenaGroupOrder)) return null;

  const arenaIndices = arenaIndicesForOrderPanel(groups, arenaGroupOrder);
  const summary = arenaIndices
    .map((ai) => {
      const n = groups.filter((g) => g.arenaIndex === ai).length;
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
