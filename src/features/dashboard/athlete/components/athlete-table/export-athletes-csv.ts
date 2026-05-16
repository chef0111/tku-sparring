import type { Table } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '""')}"`;
  }
  if (typeof value === 'number') return String(value);
  return String(value);
}

/** CSV export for athletes: UI can use a single name column while export keeps Image separate. */
export function exportAthletesTableToCSV(
  table: Table<AthleteProfileData>,
  opts: { filename?: string; onlySelected?: boolean } = {}
): void {
  const { filename = 'athletes', onlySelected = false } = opts;

  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows;

  const headerRow = [
    'Athlete ID',
    'Name',
    'Image',
    'Gender',
    'Belt level',
    'Weight',
    'Affiliation',
  ];

  const dataRows = rows.map((row) => {
    const a = row.original;
    return [
      csvCell(a.athleteCode ?? ''),
      csvCell(a.name),
      csvCell(a.image ?? ''),
      csvCell(a.gender),
      csvCell(a.beltLevel),
      csvCell(a.weight),
      csvCell(a.affiliation),
    ];
  });

  const csvContent = [
    headerRow.join(','),
    ...dataRows.map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
