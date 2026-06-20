import { useDroppable } from '@dnd-kit/core';
import { BetweenHorizonalEnd } from 'lucide-react';
import { DivisionsPanelSkeleton } from '../skeletons';
import { ArenaOrderRailHint } from './arena-division-order-sheet/arena-order-rail-hint';
import { BracketActionQueue } from './bracket-action-queue';
import { DivisionsTabsHeader } from './divisions-tabs-header';
import { PanelAthleteRow } from './panel-athlete-row';
import { useTournamentBracket } from '@/features/dashboard/contexts/tournament-bracket/use-tournament-bracket';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export function DivisionsPanel() {
  const {
    divisions,
    arenaDivisionOrder,
    selectedDivisionId,
    setSelectedDivisionId,
    panelPoolAthletes,
    matches,
    readOnly,
    isDraft,
    setArenaOrderSheetOpen,
    slotReturnEnabled,
    athleteCount,
    isPoolLoading,
    showArrangedHint,
  } = useTournamentBracket();

  const poolDrop = useDroppable({
    id: `bracket-panel-pool-${selectedDivisionId ?? 'none'}`,
    disabled: readOnly || !selectedDivisionId || !slotReturnEnabled,
    data: {
      from: 'panel-drop' as const,
      divisionId: selectedDivisionId,
    },
  });

  return (
    <aside className="bg-card dark:bg-drawer flex h-full min-h-0 w-xs shrink-0 flex-col border-l shadow-sm">
      <DivisionsTabsHeader
        divisions={divisions}
        selectedDivisionId={selectedDivisionId}
        onSelect={setSelectedDivisionId}
      />
      <ArenaOrderRailHint
        divisions={divisions}
        arenaDivisionOrder={arenaDivisionOrder}
        isDraft={isDraft}
        readOnly={readOnly}
        onEdit={() => setArenaOrderSheetOpen(true)}
      />
      <div
        ref={poolDrop.setNodeRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto transition-colors',
          poolDrop.isOver && slotReturnEnabled && !readOnly && 'bg-primary/5'
        )}
      >
        <div className="flex flex-col gap-1.5 p-2">
          {isPoolLoading ? (
            <DivisionsPanelSkeleton showPanelHint={showArrangedHint} />
          ) : panelPoolAthletes.length > 0 ? (
            <>
              <header className="flex flex-col gap-1 px-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="bg-primary/80 size-1.5 shrink-0 rounded-full"
                    aria-hidden
                  />
                  <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {divisions.find((d) => d.id === selectedDivisionId)?.name}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs leading-snug">
                  Drag & drop athletes to bracket
                </p>
              </header>
              {panelPoolAthletes.map((a) => (
                <PanelAthleteRow
                  key={a.id}
                  athlete={a}
                  divisionId={selectedDivisionId ?? ''}
                  readOnly={readOnly}
                />
              ))}
            </>
          ) : matches.length > 0 ? (
            <BracketActionQueue />
          ) : athleteCount === 0 ? (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyTitle>No athletes in this division</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : showArrangedHint ? (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BetweenHorizonalEnd />
                </EmptyMedia>
                <EmptyTitle>All athletes are arranged</EmptyTitle>
                <EmptyDescription>
                  Drag from the bracket here to remove an athlete.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyTitle>No athletes to show</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </aside>
  );
}
