import { useState } from 'react';
import { IconGripVertical, IconPlus, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import { useCreateAthleteProfile } from '@/queries/athlete-profiles';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable';

interface AthleteAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AthleteRow {
  id: string;
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
}

function createEmptyRow(): AthleteRow {
  return {
    id: crypto.randomUUID(),
    athleteCode: '',
    name: '',
    gender: 'M',
    beltLevel: 0,
    weight: 60,
    affiliation: '',
  };
}

export function AthleteAddDrawer({
  open,
  onOpenChange,
}: AthleteAddDrawerProps) {
  const [rows, setRows] = useState<Array<AthleteRow>>(() => [createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateAthleteProfile();

  function updateRow(
    index: number,
    field: keyof Omit<AthleteRow, 'id'>,
    value: string | number
  ) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  async function onSubmit() {
    const errors: Array<string> = [];

    rows.forEach((row, i) => {
      const label = `Row ${i + 1}`;
      if (!row.name.trim()) errors.push(`${label}: Name is required`);
      if (!row.affiliation.trim())
        errors.push(`${label}: Affiliation is required`);
      if (row.weight < 20 || row.weight > 150)
        errors.push(`${label}: Weight must be between 20 and 150 kg`);
    });

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
      try {
        await createMutation.mutateAsync({
          athleteCode: row.athleteCode || undefined,
          name: row.name,
          gender: row.gender,
          beltLevel: row.beltLevel,
          weight: row.weight,
          affiliation: row.affiliation,
          confirmDuplicate: false,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsSubmitting(false);
    onOpenChange(false);

    if (failCount === 0) {
      toast.success(`${successCount} athlete(s) created successfully`);
    } else {
      toast.warning(`${successCount} created, ${failCount} failed`);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value) setRows([createEmptyRow()]);
    onOpenChange(value);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
    >
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Add Athletes</DrawerTitle>
          <DrawerDescription>
            Fill in each row and click Create to add multiple athletes at once.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <Sortable
            value={rows}
            onValueChange={setRows}
            getItemValue={(r) => r.id}
            orientation="vertical"
          >
            <SortableContent className="flex flex-col">
              {rows.map((row, index) => (
                <SortableItem
                  key={row.id}
                  value={row.id}
                  className="flex items-center gap-2 border-b py-2 last:border-0"
                >
                  <SortableItemHandle className="text-muted-foreground">
                    <IconGripVertical className="size-4" />
                  </SortableItemHandle>

                  <Input
                    className="w-20"
                    placeholder="Code"
                    value={row.athleteCode}
                    onChange={(e) =>
                      updateRow(index, 'athleteCode', e.target.value)
                    }
                  />

                  <Input
                    className="min-w-28 flex-1"
                    placeholder="Name *"
                    value={row.name}
                    onChange={(e) => updateRow(index, 'name', e.target.value)}
                  />

                  <Select
                    value={row.gender}
                    onValueChange={(v) =>
                      updateRow(index, 'gender', v as 'M' | 'F')
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(row.beltLevel)}
                    onValueChange={(v) =>
                      updateRow(index, 'beltLevel', Number(v))
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BELT_LEVELS.map((belt) => (
                        <SelectItem key={belt.value} value={String(belt.value)}>
                          {belt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    className="w-20"
                    placeholder="kg"
                    min={20}
                    max={150}
                    value={row.weight}
                    onChange={(e) =>
                      updateRow(index, 'weight', Number(e.target.value))
                    }
                  />

                  <Input
                    className="w-36"
                    placeholder="Club / Gym"
                    value={row.affiliation}
                    onChange={(e) =>
                      updateRow(index, 'affiliation', e.target.value)
                    }
                  />

                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeRow(index)}
                    >
                      <IconX />
                    </Button>
                  )}
                </SortableItem>
              ))}
            </SortableContent>

            <SortableOverlay>
              {({ value }) => {
                const row = rows.find((r) => r.id === value);
                return (
                  <div className="bg-background flex items-center gap-2 rounded-md border px-3 py-2 shadow-md">
                    <IconGripVertical className="text-muted-foreground size-4" />
                    <span className="text-sm">{row?.name || '(empty)'}</span>
                  </div>
                );
              }}
            </SortableOverlay>
          </Sortable>
        </div>

        <DrawerFooter className="flex-row justify-between">
          <Button variant="outline" onClick={addRow} disabled={isSubmitting}>
            <IconPlus />
            Add Row
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : `Create ${rows.length} Athlete(s)`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
