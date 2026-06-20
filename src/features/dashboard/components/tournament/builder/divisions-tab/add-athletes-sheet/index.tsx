import { UserPlus } from 'lucide-react';
import {
  PoolBeltFilter,
  PoolGenderSelect,
  PoolSearchInput,
  PoolWeightFilter,
} from '../athlete-pool/filters';
import { AddAthletesList } from './add-athletes-list';
import { useAddAthletesSheet } from '@/features/dashboard/hooks/use-add-athletes-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface AddAthletesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
  readOnly: boolean;
}

export function AddAthletesSheet({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  readOnly,
}: AddAthletesSheetProps) {
  const sheet = useAddAthletesSheet({
    open,
    onOpenChange,
    tournamentId,
    readOnly,
  });

  const { filters, list, selection, virtual, submit } = sheet;

  return (
    <SheetContent className="flex w-full flex-col gap-2 sm:max-w-lg">
      <SheetHeader>
        <SheetTitle className="text-lg">Add athletes</SheetTitle>
        <SheetDescription>
          Pick athletes from your library to add to{' '}
          <span className="font-semibold">{tournamentName}</span>.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 pt-0">
        <div className="flex flex-col gap-2">
          <PoolSearchInput value={filters.query} onChange={filters.setQuery} />
          <div className="flex gap-2">
            <PoolGenderSelect
              value={filters.gender}
              onChange={filters.setGender}
            />
            <PoolBeltFilter
              poolBeltMin={filters.beltMin}
              poolBeltMax={filters.beltMax}
              onPatch={filters.patchBeltFilter}
            />
            <PoolWeightFilter
              poolWeightMin={filters.weightMin}
              poolWeightMax={filters.weightMax}
              onPatch={filters.patchWeightFilter}
            />
          </div>
        </div>

        {list.items.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="select-all-page"
              checked={selection.allShownSelected}
              onCheckedChange={selection.toggleSelectAllShown}
            />
            <Label
              htmlFor="select-all-page"
              className="cursor-pointer text-xs font-normal"
            >
              Select all shown ({list.items.length}
              {list.items.length < list.total ? ` of ${list.total}` : ''})
            </Label>
          </div>
        )}

        <AddAthletesList
          list={list}
          virtual={virtual}
          selectedIds={selection.selectedIds}
          onToggleProfile={selection.toggleProfile}
        />
      </div>

      <SheetFooter className="flex-col gap-3 sm:flex-col sm:items-stretch">
        <div className="flex items-start gap-2">
          <Checkbox
            id="add-auto-assign"
            checked={selection.autoAssign}
            onCheckedChange={(v) => selection.setAutoAssign(!!v)}
          />
          <div className="grid gap-1">
            <Label
              htmlFor="add-auto-assign"
              className="cursor-pointer font-normal"
            >
              Auto-assign by division constraints
            </Label>
            {selection.autoAssign && (
              <p className="text-muted-foreground text-xs">
                Athletes will be placed in divisions matching their gender,
                belt, and weight. Unmatched athletes go to the unassigned pool.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs tabular-nums">
            {selection.selectedCount} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={submit.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submit.handleSubmit}
              disabled={!submit.canSubmit}
              className="cursor-pointer"
            >
              {submit.isPending ? (
                <>
                  <Spinner />
                  <span>Adding…</span>
                </>
              ) : (
                <>
                  <UserPlus data-icon="inline-start" />
                  Add to tournament
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetFooter>
    </SheetContent>
  );
}
