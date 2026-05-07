import { useState } from 'react';
import { IconGripVertical, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

import { AthleteRowFields } from './athlete-row-fields';
import type { AthleteRow } from '../../types/athlete';
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
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable';
import { Spinner } from '@/components/ui/spinner';

interface AthleteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function onIsolateSortableFromDrawerGesture(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function AthleteDrawer({ open, onOpenChange }: AthleteDrawerProps) {
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
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function handleOpenChange(value: boolean) {
    if (!value) setRows([createEmptyRow()]);
    onOpenChange(value);
  }

  async function onSubmit() {
    const errors: Array<string> = [];

    rows.forEach((row, i) => {
      const label = `Row ${i + 1}`;
      if (!row.athleteCode.trim())
        errors.push(`${label}: Athlete ID is required`);
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
          athleteCode: row.athleteCode.trim(),
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
    handleOpenChange(false);

    if (failCount === 0) {
      toast.success(
        `${successCount} ${successCount === 1 ? 'Athlete' : 'Athletes'} created successfully`
      );
    } else {
      toast.warning(
        `${successCount} ${successCount === 1 ? 'Athlete' : 'Athletes'} created, ${failCount} failed`
      );
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
      modal={false}
    >
      <DrawerContent className="mx-auto max-h-[65vh] max-w-5xl border">
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
            <SortableContent className="flex flex-col gap-2">
              {rows.map((row, index) => (
                <SortableItem
                  key={row.id}
                  value={row.id}
                  className="flex items-center gap-2 rounded-xl border p-2"
                >
                  <SortableItemHandle
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-1 py-2"
                    onPointerDownCapture={onIsolateSortableFromDrawerGesture}
                    onTouchStartCapture={onIsolateSortableFromDrawerGesture}
                  >
                    <IconGripVertical className="size-4" />
                  </SortableItemHandle>

                  <AthleteRowFields
                    row={row}
                    index={index}
                    readOnly={false}
                    rowCount={rows.length}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                  />
                </SortableItem>
              ))}
            </SortableContent>

            <SortableOverlay className="z-60">
              {({ value }) => {
                const activeIndex = rows.findIndex((r) => r.id === value);
                const row = activeIndex === -1 ? undefined : rows[activeIndex];
                if (!row) return null;

                return (
                  <div className="pointer-events-none flex items-center gap-2 rounded-xl border p-2">
                    <button
                      type="button"
                      className="bg-muted cursor-grabbing rounded-md px-1 py-2"
                      aria-hidden
                    >
                      <IconGripVertical className="size-4" />
                    </button>
                    <AthleteRowFields
                      readOnly
                      row={row}
                      index={activeIndex}
                      rowCount={rows.length}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                    />
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
            {isSubmitting ? (
              <>
                <Spinner className="text-primary-foreground" />
                <span>Creating…</span>
              </>
            ) : (
              `Create ${rows.length} ${rows.length === 1 ? 'Athlete' : 'Athletes'}`
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
