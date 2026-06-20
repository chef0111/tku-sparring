import * as React from 'react';
import { DndContext } from '@dnd-kit/core';
import { toast } from 'sonner';
import { AddDivisionDialog } from '../dialogs/add-division-dialog';
import { DivisionSettingsSheet } from '../dialogs/division-settings-sheet';
import { AddAthletesSheet } from './add-athletes-sheet';
import { AthletePool } from './athlete-pool';
import { DivisionRosterTable } from './division-roster-table';
import { DivisionsRail } from './divisions-rail';
import type { DragEndEvent } from '@dnd-kit/core';
import type { DivisionData } from '@/contracts/tournament/division';
import { useBuilderManagerQuery } from '@/features/dashboard/hooks/use-builder-manager-query';
import { useAssignAthlete } from '@/queries/division';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';

interface DivisionsTabProps {
  tournamentId: string;
  tournamentName: string;
  divisions: Array<DivisionData>;
  readOnly: boolean;
}

export function DivisionsTab({
  tournamentId,
  tournamentName,
  divisions,
  readOnly,
}: DivisionsTabProps) {
  const {
    selectedDivisionId,
    setSelectedDivision,
    addAthletes,
    setAddAthletes,
  } = useBuilderManagerQuery();

  const assignAthlete = useAssignAthlete({ suppressErrorToast: true });

  const [showAddDivision, setShowAddDivision] = React.useState(false);
  const [addAthletesOpen, setAddAthletesOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsDivision, setSettingsDivision] =
    React.useState<DivisionData | null>(null);

  React.useEffect(() => {
    if (!selectedDivisionId && divisions.length > 0) {
      void setSelectedDivision(divisions[0]!.id);
    }
  }, [selectedDivisionId, divisions, setSelectedDivision]);

  React.useEffect(() => {
    if (readOnly) {
      setShowAddDivision(false);
      setSettingsOpen(false);
      setAddAthletesOpen(false);
    }
  }, [readOnly]);

  React.useEffect(() => {
    if (addAthletes && !readOnly) {
      void setAddAthletes(null);
      setAddAthletesOpen(false);
    }
  }, [addAthletes, readOnly, setAddAthletes, setAddAthletesOpen]);

  const selectedDivision =
    divisions.find((d) => d.id === selectedDivisionId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const athleteId = event.active.data.current?.athleteId as
      | string
      | undefined;
    const targetDivisionId = event.over?.data.current?.divisionId as
      | string
      | undefined;
    if (!athleteId || !targetDivisionId) return;
    if (event.active.data.current?.fromDivisionId === targetDivisionId) return;
    void toast.promise(
      assignAthlete.mutateAsync({
        divisionId: targetDivisionId,
        tournamentAthleteId: athleteId,
      }),
      {
        loading: 'Adding to division…',
        success: 'Added to division',
        error: (err) =>
          err instanceof Error ? err.message : 'Could not add athlete',
      }
    );
  };

  const prepareSettingsDivision = (division: DivisionData) => {
    setSettingsDivision(division);
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open);
    if (!open) setSettingsDivision(null);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 w-full">
        <Sheet open={addAthletesOpen} onOpenChange={setAddAthletesOpen}>
          <AthletePool
            tournamentId={tournamentId}
            selectedDivisionId={selectedDivisionId}
            readOnly={readOnly}
          />
          <AddAthletesSheet
            open={addAthletesOpen}
            onOpenChange={setAddAthletesOpen}
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            readOnly={readOnly}
          />
        </Sheet>
        <Sheet
          open={settingsOpen}
          onOpenChange={handleSettingsOpenChange}
          modal={false}
        >
          <DivisionRosterTable
            division={selectedDivision}
            tournamentId={tournamentId}
            divisions={divisions}
            readOnly={readOnly}
            prepareSettingsDivision={prepareSettingsDivision}
          />
          <DivisionsRail
            divisions={divisions}
            selectedDivisionId={selectedDivisionId}
            readOnly={readOnly}
            onSelect={(id) => void setSelectedDivision(id)}
            prepareSettingsDivision={prepareSettingsDivision}
            onOpenAddDivision={() => setShowAddDivision(true)}
          />
          <DivisionSettingsSheet
            division={settingsDivision}
            onOpenChange={handleSettingsOpenChange}
          />
        </Sheet>
        <Dialog open={showAddDivision} onOpenChange={setShowAddDivision}>
          <AddDivisionDialog
            key={String(showAddDivision)}
            onOpenChange={setShowAddDivision}
            tournamentId={tournamentId}
          />
        </Dialog>
      </div>
    </DndContext>
  );
}
