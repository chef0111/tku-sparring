import { SaveIcon, Trash2 } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { useAppForm } from '@/components/form/hooks';
import { useDeleteGroup, useUpdateGroup } from '@/queries/groups';
import { Spinner } from '@/components/ui/spinner';

interface GroupSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupData | null;
}

export function GroupSettingsSheet({
  open,
  onOpenChange,
  group,
}: GroupSettingsSheetProps) {
  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Group Settings</SheetTitle>
          <SheetDescription>
            Edit constraints, arena, and preferences for {group.name}.
          </SheetDescription>
        </SheetHeader>

        <GroupSettingsForm group={group} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

interface GroupSettingsFormProps {
  group: GroupData;
  onClose: () => void;
}

function GroupSettingsForm({ group, onClose }: GroupSettingsFormProps) {
  const updateGroup = useUpdateGroup({ onSuccess: onClose });
  const deleteGroup = useDeleteGroup({ onSuccess: onClose });

  const GENDER_ANY = '__any__' as const;

  const form = useAppForm({
    defaultValues: {
      name: group.name,
      gender: group.gender ?? GENDER_ANY,
      beltMin: group.beltMin ?? undefined,
      beltMax: group.beltMax ?? undefined,
      weightMin: group.weightMin ?? undefined,
      weightMax: group.weightMax ?? undefined,
      thirdPlaceMatch: group.thirdPlaceMatch,
      arenaIndex: group.arenaIndex,
    },
    onSubmit: ({ value }) => {
      updateGroup.mutate({
        id: group.id,
        name: value.name,
        gender:
          value.gender === GENDER_ANY ? null : (value.gender as 'M' | 'F'),
        beltMin: value.beltMin ?? null,
        beltMax: value.beltMax ?? null,
        weightMin: value.weightMin ?? null,
        weightMax: value.weightMax ?? null,
        thirdPlaceMatch: value.thirdPlaceMatch,
        arenaIndex: value.arenaIndex,
      });
    },
  });

  return (
    <form
      className="flex flex-1 flex-col gap-4 px-4 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => (
          <field.Input label="Group Name" placeholder="e.g. Group A" />
        )}
      </form.AppField>

      <form.AppField name="gender">
        {(field) => (
          <field.Select label="Gender Constraint" placeholder="Any">
            <SelectItem value={GENDER_ANY}>Any</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </field.Select>
        )}
      </form.AppField>

      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="beltMin">
          {(field) => (
            <field.NumberInput label="Min Belt" min={0} max={10} step={1} />
          )}
        </form.AppField>
        <form.AppField name="beltMax">
          {(field) => (
            <field.NumberInput label="Max Belt" min={0} max={10} step={1} />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="weightMin">
          {(field) => (
            <field.NumberInput
              label="Min Weight (kg)"
              min={20}
              max={150}
              step={1}
            />
          )}
        </form.AppField>
        <form.AppField name="weightMax">
          {(field) => (
            <field.NumberInput
              label="Max Weight (kg)"
              min={20}
              max={150}
              step={1}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="thirdPlaceMatch">
        {(field) => <field.Checkbox label="Third-place match" />}
      </form.AppField>

      <form.AppField name="arenaIndex">
        {(field) => (
          <field.NumberSelect label="Arena">
            <SelectItem value="1">Arena 1</SelectItem>
            <SelectItem value="2">Arena 2</SelectItem>
            <SelectItem value="3">Arena 3</SelectItem>
          </field.NumberSelect>
        )}
      </form.AppField>

      <div className="flex gap-2 p-0 pt-6">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => deleteGroup.mutate({ id: group.id })}
          disabled={deleteGroup.isPending}
        >
          <Trash2 className="mr-1 size-3.5" />
          Delete Group
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          className="h-8.5"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={updateGroup.isPending}>
          {updateGroup.isPending ? (
            <>
              <Spinner className="text-primary-foreground" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <SaveIcon />
              <span>Save</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
