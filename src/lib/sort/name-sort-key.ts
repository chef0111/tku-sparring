export function getNameSortKey(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return last.toLowerCase();
}

export function orderFieldForColumnId(columnId: string): string {
  return columnId === 'name' ? 'nameSortKey' : columnId;
}
