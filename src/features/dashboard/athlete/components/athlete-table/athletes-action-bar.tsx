import {
  IconDownload,
  IconPencil,
  IconTrash,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import { exportAthletesTableToCSV } from './export-athletes-csv';
import type { Table } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';
import type { DataTableControlledState } from '@/hooks/use-data-table';
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar';

interface AthletesActionBarProps {
  table: Table<AthleteProfileData>;
  state: DataTableControlledState;
  onBulkAdd: () => void;
  onBulkEdit?: () => void;
  onDelete: () => void;
}

export function AthletesActionBar({
  table,
  state,
  onBulkAdd,
  onBulkEdit,
  onDelete,
}: AthletesActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const selectedRowCount = Object.keys(state.rowSelection).length;

  function onOpenChange(open: boolean) {
    if (!open) table.toggleAllRowsSelected(false);
  }

  function onExport() {
    exportAthletesTableToCSV(table, {
      filename: 'athletes',
      onlySelected: true,
    });
  }

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className="font-medium tabular-nums">{selectedRowCount}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose>
          <IconX />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        {onBulkEdit ? (
          <ActionBarItem onClick={onBulkEdit}>
            <IconPencil />
            Edit
          </ActionBarItem>
        ) : null}
        <ActionBarItem onClick={onBulkAdd}>
          <IconUserPlus />
          Add to Tournament
        </ActionBarItem>
        <ActionBarItem variant="destructive" onClick={onDelete}>
          <IconTrash />
          Delete
        </ActionBarItem>
        <ActionBarItem onClick={onExport}>
          <IconDownload />
          Export
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  );
}
