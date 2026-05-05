export interface ImportResult<T> {
  success: boolean;
  data?: Array<T>;
  error?: string;
  warnings?: Array<string>;
}

const HEADER_MAP: Record<string, string> = {
  'Athlete Code': 'athleteCode',
  Name: 'name',
  Gender: 'gender',
  'Belt Level': 'beltLevel',
  Weight: 'weight',
  Affiliation: 'affiliation',
};

function camelCaseHeader(header: string): string {
  return (
    HEADER_MAP[header] ??
    header
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
  );
}

export async function parseImportFile<T>(file: File): Promise<ImportResult<T>> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
    return {
      success: false,
      error: `Unsupported file type: .${ext}. Please use .csv or .xlsx files.`,
    };
  }

  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName ?? ''];

    if (!sheet) {
      return { success: false, error: 'No data found in file.' };
    }

    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: '',
    });

    const data = jsonData.map((row) => {
      const transformed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        transformed[camelCaseHeader(key)] = value;
      }
      return transformed as T;
    });

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse file.',
    };
  }
}
