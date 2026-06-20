import { Settings } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { DivisionData } from '@/contracts/tournament/division';
import { Button } from '@/components/ui/button';
import { SheetTrigger } from '@/components/ui/sheet';
import { Status, StatusIndicator } from '@/components/ui/status';
import { cn } from '@/lib/utils';

interface DivisionRailRowProps {
  division: DivisionData;
  active: boolean;
  readOnly: boolean;
  onSelect: (divisionId: string) => void;
  prepareSettingsDivision: (division: DivisionData) => void;
}

export function DivisionRailRow({
  division,
  active,
  readOnly,
  onSelect,
  prepareSettingsDivision,
}: DivisionRailRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: division.id,
    data: { divisionId: division.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'hover:bg-muted/40 relative flex items-center border-y-0 border-r-0 border-l-2 border-transparent',
        active && 'border-primary bg-muted/50',
        isOver && 'bg-primary/10'
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(division.id)}
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
      >
        <Status status="online" className="h-2 w-2 shrink-0 px-0">
          <StatusIndicator />
        </Status>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {division.name}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {division._count.tournamentAthletes}
        </span>
      </button>
      {!readOnly && (
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-1 size-6 shrink-0"
            aria-label="Division settings"
            disabled={!active}
            onClick={(e) => {
              e.stopPropagation();
              prepareSettingsDivision(division);
            }}
          >
            <Settings className="size-3.5" />
          </Button>
        </SheetTrigger>
      )}
    </div>
  );
}
