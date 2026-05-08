import { toast } from 'sonner';
import {
  ChartNoAxesColumn,
  Mars,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type {
  AthleteProfileData,
  ColumnOptions,
} from '@/features/dashboard/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import { useUpdateAthleteProfile } from '@/queries/athlete-profiles';

interface AthletesActionMenuProps {
  options: ColumnOptions;
  row: Row<AthleteProfileData>;
}

type GenderValue = (typeof GENDER_OPTIONS)[number]['value'];

export default function AthletesActionMenu({
  options,
  row,
}: AthletesActionMenuProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();
  const updateMutation = useUpdateAthleteProfile({ suppressToast: true });

  const isUpdating = isUpdatePending || updateMutation.isPending;

  const onUpdate = React.useCallback(
    (updates: { gender?: GenderValue; beltLevel?: number }) => {
      startUpdateTransition(() => {
        toast.promise(
          updateMutation.mutateAsync({
            id: row.original.id,
            athleteCode: row.original.athleteCode,
            ...updates,
          }),
          {
            loading: 'Updating...',
            success: 'Athlete updated',
            error: (err) =>
              err instanceof Error ? err.message : 'Update failed',
          }
        );
      });
    },
    [
      row.original.athleteCode,
      row.original.id,
      startUpdateTransition,
      updateMutation,
    ]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute inset-2 size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem
          onClick={() => options.onRowAction({ row, variant: 'update' })}
        >
          <Pencil className="mr-2 size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Mars className="mr-2 size-4" />
            Gender
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={row.original.gender}
              onValueChange={(value) => {
                if (value === row.original.gender) return;
                const genderValue = GENDER_OPTIONS.find(
                  (option) => option.value === value
                )?.value;
                if (!genderValue) return;
                onUpdate({ gender: genderValue });
              }}
            >
              {GENDER_OPTIONS.map((gender) => (
                <DropdownMenuRadioItem
                  key={gender.value}
                  value={gender.value}
                  disabled={isUpdating}
                  className="min-w-32"
                >
                  {gender.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ChartNoAxesColumn className="mr-2 size-4" />
            Belt level
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={String(row.original.beltLevel)}
              onValueChange={(value) => {
                const beltLevel = Number(value);
                if (Number.isNaN(beltLevel)) return;
                if (beltLevel === row.original.beltLevel) return;
                onUpdate({ beltLevel });
              }}
            >
              {BELT_LEVELS.map((belt) => (
                <DropdownMenuRadioItem
                  key={belt.value}
                  value={String(belt.value)}
                  disabled={isUpdating}
                  className="min-w-36"
                >
                  {belt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => options.onRowAction({ row, variant: 'delete' })}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
