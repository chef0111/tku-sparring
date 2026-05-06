import {
  IconDownload,
  IconTrash,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import type { Table } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar';
import { exportTableToCSV } from '@/lib/data-table/export';

interface AthletesActionBarProps {
  table: Table<AthleteProfileData>;
  onBulkAdd: () => void;
  onDelete: () => void;
}

export function AthletesActionBar({
  table,
  onBulkAdd,
  onDelete,
}: AthletesActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;

  function onOpenChange(open: boolean) {
    if (!open) table.toggleAllRowsSelected(false);
  }

  function onExport() {
    exportTableToCSV(table, {
      filename: 'athletes',
      excludeColumns: ['select', 'actions'],
      onlySelected: true,
      headers: {
        athleteCode: 'Athlete Code',
        name: 'Name',
        gender: 'Gender',
        beltLevel: 'Belt Level',
        weight: 'Weight',
        affiliation: 'Affiliation',
      },
    });
  }

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className="font-medium tabular-nums">{rows.length}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose>
          <IconX />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
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
