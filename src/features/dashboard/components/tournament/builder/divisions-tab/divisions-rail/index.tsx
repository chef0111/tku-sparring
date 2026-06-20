import { Plus } from 'lucide-react';
import { DivisionRailRow } from './division-rail-row';
import type { DivisionData } from '@/contracts/tournament/division';
import { Button } from '@/components/ui/button';

interface DivisionsRailProps {
  divisions: Array<DivisionData>;
  selectedDivisionId: string | null;
  readOnly: boolean;
  onSelect: (divisionId: string) => void;
  prepareSettingsDivision: (division: DivisionData) => void;
  onOpenAddDivision: () => void;
}

export function DivisionsRail({
  divisions,
  selectedDivisionId,
  readOnly,
  onSelect,
  prepareSettingsDivision,
  onOpenAddDivision,
}: DivisionsRailProps) {
  return (
    <div className="bg-card flex w-64 shrink-0 flex-col overflow-hidden border-l">
      {!readOnly && (
        <div className="border-b p-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onOpenAddDivision}
          >
            <Plus className="mr-1 size-3.5" />
            Add Division
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {divisions.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">
            No divisions yet <br /> Click + Add Division above
          </div>
        ) : (
          <div className="divide-y">
            {divisions.map((division) => (
              <DivisionRailRow
                key={division.id}
                division={division}
                active={division.id === selectedDivisionId}
                readOnly={readOnly}
                onSelect={onSelect}
                prepareSettingsDivision={prepareSettingsDivision}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
