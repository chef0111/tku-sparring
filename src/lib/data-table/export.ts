import type { Table } from '@tanstack/react-table';

interface ExportOptions<TData> {
  filename?: string;
  excludeColumns?: Array<keyof TData | 'select' | 'actions'>;
  onlySelected?: boolean;
  headers?: Record<string, string>;
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: ExportOptions<TData> = {}
): void {
  const {
    filename = 'export',
    excludeColumns = [],
    onlySelected = false,
    headers = {},
  } = opts;

  const columns = table
    .getAllLeafColumns()
    .filter(
      (col) =>
        !excludeColumns.includes(col.id as keyof TData | 'select' | 'actions')
    );

  const headerRow = columns.map((col) => headers[col.id] ?? col.id);

  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows;

  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const value = row.getValue(col.id);
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    })
  );

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
