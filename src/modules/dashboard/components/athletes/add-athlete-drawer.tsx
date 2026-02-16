import * as React from 'react';
import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { AddAthletesForm } from '@/modules/dashboard/components/forms/add-athletes';
import { useCreateAthletes } from '@/queries/athletes';

interface AddAthleteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  tournamentId?: string;
}

export function AddAthleteDrawer({
  open,
  onOpenChange,
  groupId,
  tournamentId,
}: AddAthleteDrawerProps) {
  const createAthletes = useCreateAthletes({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = React.useCallback(
    (
      athletes: Array<{
        code: string;
        name: string;
        beltLevel: string;
        weight: string;
        affiliation: string;
      }>
    ) => {
      createAthletes.mutate({
        athletes: athletes.map((a) => ({
          ...a,
          weight: parseFloat(a.weight),
          groupId: groupId ?? '',
          tournamentId: tournamentId ?? '',
        })),
      });
    },
    [createAthletes, groupId, tournamentId]
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="ring-ring/10 no-focus mx-auto flex max-w-240 border-2 ring-3">
        <div className="overflow-y-auto px-4">
          <AddAthletesForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isPending={createAthletes.isPending}
          />
        </div>
        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}
