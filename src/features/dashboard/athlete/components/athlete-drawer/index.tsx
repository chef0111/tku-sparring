import { useEffect, useState } from 'react';
import { IconGripVertical, IconPlus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PlusIcon, SaveIcon } from 'lucide-react';
import { AthleteRowFields } from './athlete-row-fields';
import type { AthleteRow } from '@/features/dashboard/types';
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
import { client } from '@/orpc/client';

export type AthleteDrawerMode = 'create' | 'bulk-edit';

interface AthleteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AthleteDrawerMode;
  /** Prefill when `mode` is `bulk-edit` (row `id` = athlete profile id). */
  seedRows?: Array<AthleteRow> | null;
  /** Called after bulk-edit requests finish (before drawer closes). */
  onBulkEditSaved?: () => void;
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
    image: '',
  };
}

function onIsolateSortableFromDrawerGesture(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function seedKey(rows: Array<AthleteRow> | null | undefined) {
  return rows?.length ? rows.map((r) => r.id).join('\0') : '';
}

export function AthleteDrawer({
  open,
  onOpenChange,
  mode = 'create',
  seedRows = null,
  onBulkEditSaved,
}: AthleteDrawerProps) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Array<AthleteRow>>(() => [createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seedRowsKey = seedKey(seedRows);

  useEffect(() => {
    if (!open) return;
    if (mode === 'bulk-edit' && seedRows && seedRows.length > 0) {
      setRows(seedRows.map((r) => ({ ...r })));
    } else {
      setRows([createEmptyRow()]);
    }
  }, [open, mode, seedRowsKey]);

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

    try {
      if (mode === 'bulk-edit') {
        const results = await Promise.allSettled(
          rows.map((row) => {
            const trimmedImage = row.image.trim();
            return client.athleteProfile.update({
              id: row.id,
              athleteCode: row.athleteCode.trim(),
              name: row.name,
              gender: row.gender,
              beltLevel: row.beltLevel,
              weight: row.weight,
              affiliation: row.affiliation,
              image: trimmedImage === '' ? null : trimmedImage,
            });
          })
        );
        const successCount = results.filter(
          (r) => r.status === 'fulfilled'
        ).length;
        const failCount = results.length - successCount;
        await queryClient.invalidateQueries({ queryKey: ['athleteProfile'] });
        onBulkEditSaved?.();
        handleOpenChange(false);
        if (failCount === 0) {
          toast.success(
            `${successCount} ${successCount === 1 ? 'Athlete' : 'Athletes'} updated`
          );
        } else {
          toast.warning(
            `Updated ${successCount} athletes, ${failCount} failed`
          );
        }
      } else {
        const results = await Promise.allSettled(
          rows.map((row) => {
            const trimmedImage = row.image.trim();
            return client.athleteProfile.create({
              athleteCode: row.athleteCode.trim(),
              name: row.name,
              gender: row.gender,
              beltLevel: row.beltLevel,
              weight: row.weight,
              affiliation: row.affiliation,
              ...(trimmedImage ? { image: trimmedImage } : {}),
              confirmDuplicate: false,
            });
          })
        );
        const successCount = results.filter(
          (r) => r.status === 'fulfilled'
        ).length;
        const failCount = results.length - successCount;
        await queryClient.invalidateQueries({ queryKey: ['athleteProfile'] });
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBulkEdit = mode === 'bulk-edit';

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
      modal={false}
    >
      <DrawerContent className="mx-auto max-h-[65vh] max-w-5xl border">
        <DrawerHeader>
          <DrawerTitle>
            {isBulkEdit ? 'Edit Athletes' : 'Add Athletes'}
          </DrawerTitle>
          <DrawerDescription>
            {isBulkEdit
              ? 'Edit selected rows and save. Changes are sent in parallel.'
              : 'Fill in each row and click Create to add multiple athletes at once.'}
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
                  className="flex min-w-0 items-center gap-2 rounded-xl border p-2"
                >
                  <SortableItemHandle
                    className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 rounded-md px-1 py-2"
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
                  <div className="pointer-events-none flex min-w-0 items-center gap-2 rounded-xl border p-2">
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
          {!isBulkEdit ? (
            <Button variant="outline" onClick={addRow} disabled={isSubmitting}>
              <IconPlus />
              Add Row
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="text-primary-foreground" />
                <span>{isBulkEdit ? 'Saving…' : 'Creating…'}</span>
              </>
            ) : isBulkEdit ? (
              <>
                <SaveIcon />
                {`Save ${rows.length} ${
                  rows.length === 1 ? 'Athlete' : 'Athletes'
                }`}
              </>
            ) : (
              <>
                <PlusIcon />
                {`Create ${rows.length} ${
                  rows.length === 1 ? 'Athlete' : 'Athletes'
                }`}
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
