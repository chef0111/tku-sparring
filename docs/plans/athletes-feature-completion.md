# Athletes Feature Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Athletes feature with multi-add drawer, edit sheet, ActionBar, import/export, feature flags, column resizing fix, and navigation optimizations.

**Architecture:** Replace Dialog-based add/edit with Drawer (multi-add) and Sheet (edit). Port ActionBar from tablecn. Add feature flag system with localStorage toggle. Fix column resizing at DataTable level. Optimize Athletes route with prefetch + pending UI + tighter query caching.

**Tech Stack:** TanStack Router, TanStack Query, shadcn/ui (Drawer, Sheet), dnd-kit (existing Sortable), xlsx (for import), nuqs (URL state).

---

## Goals

1. **Multi-Add Drawer** — Bottom drawer supporting 1-N athlete rows, each on one line, draggable/reorderable with handle
2. **Edit Sheet** — Right-side Sheet reusing existing single-row form with validation
3. **Feature Flags** — Config-based flags with localStorage toggle, matching tablecn pattern
4. **Import/Export** — Toolbar buttons (always visible); CSV export, xlsx/csv import with error handling
5. **ActionBar** — Floating selection bar using tablecn ActionBar pattern
6. **Column Resizing Fix** — Global fix in shared DataTable so resize handles work
7. **Navigation Optimization** — Instant transitions, pending UI, prefetch, tighter query caching

---

## Task 1: Add shadcn Drawer Component

The Drawer component is required for the multi-add flow but doesn't exist in the project.

**Install shadcn drawer component**

```bash
npx shadcn@latest add drawer
```

---

## Task 2: Create Feature Flags System

**Files:**

- Create: `src/config/feature-flags.ts`
- Create: `src/hooks/use-feature-flags.ts`
- Create: `src/components/data-table/data-table-feature-toggle.tsx`

Mirror the tablecn pattern from `tablecn/src/config/flag.ts`.

- **Step 2.1: Create feature flag config**

```tsx
// src/config/feature-flags.ts
import { FileSpreadsheetIcon, ColumnsIcon } from 'lucide-react';

export interface FeatureFlag {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltipTitle: string;
  tooltipDescription: string;
}

export const featureFlagConfig = {
  dataTable: [
    {
      label: 'Column resizing',
      value: 'columnResizing' as const,
      icon: ColumnsIcon,
      tooltipTitle: 'Column resizing',
      tooltipDescription: 'Enable drag-to-resize columns in data tables.',
    },
    // Add more flags as needed
  ],
} as const;

export type DataTableFeatureFlag =
  (typeof featureFlagConfig.dataTable)[number]['value'];
```

- **Step 2.2: Create feature flags hook**

```tsx
// src/hooks/use-feature-flags.ts
const STORAGE_KEY = 'tku-feature-flags';

export function useFeatureFlags() {
  // Read from localStorage, return { flags, setFlag, isEnabled }
  // Pattern: flags stored as { [key: string]: boolean }
}
```

- **Step 2.3: Create feature toggle dropdown for DataTable toolbar**

```tsx
// src/components/data-table/data-table-feature-toggle.tsx
// Dropdown with checkboxes for each flag
// Uses Tooltip for descriptions
// Saves to localStorage on toggle
```

---

## Task 3: Fix Column Resizing in DataTable

**Files:**

- Modify: `src/components/data-table/data-table.tsx:88-106` (resize handle)
- Modify: `src/components/ui/table.tsx` (add table-layout fixed)

The current resize handle doesn't drag because pointer events are blocked or the hit area is too small.

- **Step 3.1: Diagnose resize handle issue**

Current code at `data-table.tsx:88-106`:

```tsx
{
  header.column.getCanResize() && (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        header.getResizeHandler()(e);
      }}
      // ...
      className={cn(
        'absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none'
        // ...
      )}
    />
  );
}
```

Issues to check:

1. `w-1` (4px) may be too narrow for reliable dragging
2. Parent `TableHead` may have `overflow: hidden` clipping the handle
3. May need `onDoubleClick` for auto-fit

- **Step 3.2: Fix resize handle hit area**

Expand the hit area while keeping visual width narrow:

```tsx
<div
  onMouseDown={(e) => {
    e.preventDefault();
    header.getResizeHandler()(e);
  }}
  onTouchStart={(e) => {
    e.preventDefault();
    header.getResizeHandler()(e);
  }}
  onDoubleClick={() => header.column.resetSize()}
  className={cn(
    // Visual line is 2px, but hit area is 8px with negative offset
    'absolute top-0 -right-1 h-full w-2 cursor-col-resize touch-none select-none',
    'before:absolute before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2',
    'before:bg-border before:opacity-0 before:transition-opacity',
    'hover:before:opacity-100',
    header.column.getIsResizing() && 'before:bg-primary before:opacity-100'
  )}
/>
```

- **Step 3.3: Add table-layout fixed for predictable column widths**

In `src/components/ui/table.tsx`, add `table-layout: fixed` when column sizing is enabled:

```tsx
function Table({ className, style, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        style={{ tableLayout: 'fixed', ...style }}
        {...props}
      />
    </div>
  );
}
```

- **Step 3.4: Test resize in Athletes table**

Manual verification: drag column borders in Athletes table, confirm resize works.

---

## Task 4: Port ActionBar Component from tablecn

**Files:**

- Create: `src/components/ui/action-bar.tsx`
- Modify: `src/lib/compose-refs.ts` (if not exists)
- **Step 4.1: Verify compose-refs utility exists**

Check for `src/lib/compose-refs.ts`. If missing, create it:

```tsx
// src/lib/compose-refs.ts
import * as React from 'react';

export function useComposedRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return React.useCallback((node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<T>).current = node;
      }
    }
  }, refs);
}
```

- **Step 4.2: Port ActionBar from tablecn**

Copy `tablecn/src/components/ui/action-bar.tsx` to `src/components/ui/action-bar.tsx`.

Adjust imports:

- `@/hooks/use-as-ref` → create if needed or inline
- `@/hooks/use-isomorphic-layout-effect` → create if needed
- `@/lib/compose-refs` → from step 4.1
- **Step 4.3: Create missing hooks if needed**

```tsx
// src/hooks/use-as-ref.ts
export function useAsRef<T>(value: T) {
  const ref = React.useRef(value);
  React.useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

// src/hooks/use-isomorphic-layout-effect.ts
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
```

---

## Task 5: Create Export Utility

**Files:**

- Create: `src/lib/export.ts`
- **Step 5.1: Create CSV export function**

```tsx
// src/lib/export.ts
import type { Table } from '@tanstack/react-table';

interface ExportOptions<TData> {
  filename?: string;
  excludeColumns?: Array<keyof TData | 'select' | 'actions'>;
  onlySelected?: boolean;
  headers?: Record<string, string>; // column id -> human readable header
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

  // Use human-readable headers
  const headerRow = columns.map((col) => headers[col.id] ?? col.id);

  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows;

  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const value = row.getValue(col.id);
      // Escape quotes and wrap strings
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
```

---

## Task 6: Create Import Utility

**Files:**

- Create: `src/lib/import.ts`
- **Step 6.1: Install xlsx dependency**

```bash
pnpm add xlsx
```

- **Step 6.2: Create import parser**

```tsx
// src/lib/import.ts
import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
  warnings?: string[];
}

// Map human-readable headers to data keys
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
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
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
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return { success: false, error: 'No data found in file.' };
    }

    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: '',
    });

    // Transform headers to camelCase
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
```

---

## Task 7: Create Multi-Add Athlete Drawer

**Files:**

- Create: `src/features/dashboard/athlete/athlete-add-drawer.tsx`
- Modify: `src/features/dashboard/athlete/index.tsx` (replace Dialog with Drawer)
- **Step 7.1: Create athlete row form schema**

```tsx
// Inside athlete-add-drawer.tsx
interface AthleteRowValues {
  id: string; // for sortable key
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
}

function createEmptyRow(): AthleteRowValues {
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
```

- **Step 7.2: Create multi-add drawer component**

Structure:

```tsx
// src/features/dashboard/athlete/athlete-add-drawer.tsx
export function AthleteAddDrawer({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<AthleteRowValues[]>([createEmptyRow()]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Add Athletes</DrawerTitle>
          <DrawerDescription>
            Add one or more athletes to the registry.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Sortable
            value={rows}
            onValueChange={setRows}
            getItemValue={(r) => r.id}
            orientation="vertical"
          >
            <SortableContent>
              {rows.map((row, index) => (
                <AthleteRow key={row.id} row={row} index={index} ... />
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => <AthleteRowOverlay id={value} rows={rows} />}
            </SortableOverlay>
          </Sortable>

          <Button variant="outline" onClick={addRow}>
            <Plus /> Add Row
          </Button>
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit}>Create {rows.length} Athlete(s)</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

- **Step 7.3: Create single-row inline form**

Each row displays all fields in one horizontal line:

- Drag handle (SortableItemHandle) on far left
- Athlete Code (Input, optional, narrow)
- Name (Input, required, flex-1)
- Gender (Select, narrow)
- Belt Level (NumberSelect, narrow)
- Weight (NumberInput, narrow)
- Affiliation (Input, medium)
- Remove button (X icon)

```tsx
function AthleteRow({ row, index, onUpdate, onRemove, canRemove }: Props) {
  return (
    <SortableItem
      value={row.id}
      className="flex items-center gap-2 border-b py-2"
    >
      <SortableItemHandle className="cursor-grab">
        <GripVertical className="text-muted-foreground size-4" />
      </SortableItemHandle>

      <Input
        value={row.athleteCode}
        onChange={(e) => onUpdate(index, 'athleteCode', e.target.value)}
        placeholder="Code"
        className="w-20"
      />
      <Input
        value={row.name}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
        placeholder="Name *"
        className="min-w-32 flex-1"
      />
      {/* Gender, Belt, Weight, Affiliation selects/inputs */}

      {canRemove && (
        <Button variant="ghost" size="icon-sm" onClick={() => onRemove(index)}>
          <X className="size-4" />
        </Button>
      )}
    </SortableItem>
  );
}
```

- **Step 7.4: Implement batch create mutation**

```tsx
// In athlete-add-drawer.tsx
const createMutation = useCreateAthleteProfile();

async function handleSubmit() {
  // Validate all rows locally first
  const errors = rows.flatMap((row, i) => validateRow(row, i));
  if (errors.length) {
    toast.error(errors[0]);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Create sequentially, track failures
  for (const row of rows) {
    try {
      await createMutation.mutateAsync({
        athleteCode: row.athleteCode || undefined,
        name: row.name,
        gender: row.gender,
        beltLevel: row.beltLevel,
        weight: row.weight,
        affiliation: row.affiliation,
        confirmDuplicate: true, // Skip soft-dup warning, backend enforces hard-block
      });
      successCount++;
    } catch {
      failCount++;
    }
  }

  onOpenChange(false);

  if (failCount > 0) {
    toast.warning(
      `Created ${successCount} athletes, ${failCount} failed (duplicates)`
    );
  } else {
    toast.success(`Created ${successCount} athlete(s)`);
  }
}
```

- **Step 7.5: Wire up in AthleteManager**

Replace `AthleteFormDialog` for add flow with `AthleteAddDrawer`.

---

## Task 8: Create Edit Athlete Sheet

**Files:**

- Create: `src/features/dashboard/athlete/athlete-edit-sheet.tsx`
- Modify: `src/features/dashboard/athlete/index.tsx` (use Sheet for edit)
- **Step 8.1: Create edit sheet component**

Reuse the existing form structure from `athlete-form-dialog.tsx` but in a Sheet:

```tsx
// src/features/dashboard/athlete/athlete-edit-sheet.tsx
export function AthleteEditSheet({ athlete, onOpenChange }: Props) {
  // Skip duplicate check unless name or athleteCode changed
  const originalName = athlete?.name;
  const originalCode = athlete?.athleteCode;

  const form = useAppForm({
    defaultValues: { ... },
    onSubmit: async ({ value }) => {
      const nameOrCodeChanged =
        value.name !== originalName || value.athleteCode !== originalCode;

      if (nameOrCodeChanged) {
        // Run duplicate check
      }

      updateMutation.mutate({ id: athlete.id, ...value });
    },
  });

  return (
    <Sheet open={!!athlete} onOpenChange={(open) => !open && onOpenChange(null)}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={...}>
          <SheetHeader>
            <SheetTitle>Edit Athlete</SheetTitle>
            <SheetDescription>Update athlete profile.</SheetDescription>
          </SheetHeader>

          <FieldGroup className="p-4 gap-4">
            {/* Reuse exact field structure from athlete-form-dialog.tsx */}
          </FieldGroup>

          <SheetFooter>
            <Button type="submit">Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- **Step 8.2: Implement conditional duplicate check**

Only check duplicates when `name` or `athleteCode` changes from original:

```tsx
const nameOrCodeChanged =
  value.name.trim() !== originalName?.trim() ||
  (value.athleteCode || '') !== (originalCode || '');

if (nameOrCodeChanged) {
  const result = await checkDuplicate.mutateAsync({ ... });
  if (result.isHardBlock) {
    setHardBlockError('...');
    return;
  }
  // etc.
}
```

- **Step 8.3: Wire up in AthleteManager**

Replace edit path of `AthleteFormDialog` with `AthleteEditSheet`.

---

## Task 9: Create Athletes ActionBar

**Files:**

- Create: `src/features/dashboard/athlete/athletes-action-bar.tsx`
- Modify: `src/features/dashboard/athlete/index.tsx` (replace inline actionBar)
- **Step 9.1: Create athletes action bar component**

```tsx
// src/features/dashboard/athlete/athletes-action-bar.tsx
import {
  ActionBar,
  ActionBarSelection,
  ActionBarSeparator,
  ActionBarGroup,
  ActionBarItem,
  ActionBarClose,
} from '@/components/ui/action-bar';

export function AthletesActionBar({ table, onBulkAdd }: Props) {
  const rows = table.getFilteredSelectedRowModel().rows;

  const onOpenChange = (open: boolean) => {
    if (!open) table.toggleAllRowsSelected(false);
  };

  const onExport = () => {
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
  };

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className="font-medium">{rows.length}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose>
          <X />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        <ActionBarItem onClick={onBulkAdd}>
          <UserPlus /> Add to Tournament
        </ActionBarItem>
        <ActionBarItem onClick={onExport}>
          <Download /> Export
        </ActionBarItem>
        {/* Future: bulk delete */}
      </ActionBarGroup>
    </ActionBar>
  );
}
```

- **Step 9.2: Replace inline actionBar in AthleteManager**

Remove the inline `actionBar` JSX and use the component:

```tsx
<DataTable
  table={table}
  state={tableState}
  actionBar={<AthletesActionBar table={table} onBulkAdd={() => setBulkAddOpen(true)} />}
  ...
/>
```

---

## Task 10: Add Import/Export to Toolbar

**Files:**

- Modify: `src/features/dashboard/athlete/index.tsx`
- Create: `src/features/dashboard/athlete/athlete-import-dialog.tsx`
- **Step 10.1: Create import dialog component**

```tsx
// src/features/dashboard/athlete/athlete-import-dialog.tsx
export function AthleteImportDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AthleteRowValues[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const result = await parseImportFile<AthleteRowValues>(f);

    if (!result.success) {
      setError(result.error ?? 'Failed to parse file');
      setPreview(null);
    } else {
      setError(null);
      setPreview(result.data ?? []);
    }
  }

  async function handleImport() {
    if (!preview) return;

    let successCount = 0;
    let failCount = 0;

    for (const row of preview) {
      try {
        await createMutation.mutateAsync({
          athleteCode: row.athleteCode || undefined,
          name: row.name,
          gender: row.gender as 'M' | 'F',
          beltLevel: Number(row.beltLevel) || 0,
          weight: Number(row.weight) || 60,
          affiliation: row.affiliation,
          confirmDuplicate: true, // Skip soft-dup for imports
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    onOpenChange(false);
    if (failCount > 0) {
      toast.warning(
        `Imported ${successCount} athletes, ${failCount} failed (duplicates or invalid data)`
      );
    } else {
      toast.success(`Imported ${successCount} athletes`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Athletes</DialogTitle>
          <DialogDescription>
            Upload a .csv or .xlsx file to import athletes.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
        />

        {error && <Alert variant="destructive">{error}</Alert>}

        {preview && (
          <div className="max-h-64 overflow-auto">
            <p className="text-muted-foreground mb-2 text-sm">
              Found {preview.length} athletes
            </p>
            {/* Optional: preview table */}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!preview || preview.length === 0}
            onClick={handleImport}
          >
            Import {preview?.length ?? 0} Athletes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- **Step 10.2: Add toolbar buttons**

In `AthleteManager`, add Import/Export buttons inside `DataTableToolbar`:

```tsx
<DataTableToolbar table={table} state={tableState}>
  <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
    <Upload className="mr-1 size-4" />
    Import
  </Button>
  <Button variant="outline" size="sm" onClick={handleExportAll}>
    <Download className="mr-1 size-4" />
    Export
  </Button>
  <Button size="sm" onClick={() => setAddDrawerOpen(true)}>
    <Plus className="mr-1 size-4" />
    Add Athlete
  </Button>
</DataTableToolbar>
```

---

## Task 11: Optimize Athletes Route Navigation

**Files:**

- Modify: `src/routes/dashboard/athletes/index.tsx`
- Modify: `src/queries/athlete-profiles.ts`
- Possibly modify: router config

Based on TanStack Router data-loading and navigation skills:

- **Step 11.1: Add route loader with prefetch**

```tsx
// src/routes/dashboard/athletes/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { AthleteManager } from '@/features/dashboard/athlete';

export const Route = createFileRoute('/dashboard/athletes/')({
  // Validate search params for the route
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    perPage: Number(search.perPage) || 20,
    name: search.name as string | undefined,
    gender: search.gender as string | undefined,
    // ... other filters
  }),

  // Declare which search params affect cache key
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    name: search.name,
    gender: search.gender,
  }),

  // Loader runs on navigation, enables prefetch
  loader: async ({ context: { queryClient }, deps }) => {
    // Prefetch or ensure data is in cache
    await queryClient.ensureQueryData({
      queryKey: ['athleteProfile', 'list', deps],
      queryFn: () => client.athleteProfile.list(deps),
      staleTime: 30_000, // 30 seconds
    });
  },

  // Pending UI while loader runs
  pendingComponent: () => <DataTableSkeleton columnCount={7} rowCount={10} />,
  pendingMs: 100, // Show pending after 100ms
  pendingMinMs: 200, // Keep for at least 200ms to avoid flash

  component: AthleteManager,
});
```

- **Step 11.2: Configure query staleTime**

In `src/queries/athlete-profiles.ts`:

```tsx
export function useAthleteProfiles(input: ListAthleteProfilesDTO) {
  return useQuery({
    queryKey: ['athleteProfile', 'list', input] as const,
    queryFn: () => client.athleteProfile.list(input),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30 seconds - data considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
  });
}
```

- **Step 11.3: Add preload to sidebar link**

If sidebar uses Link component, add `preload="intent"`:

```tsx
<Link to="/dashboard/athletes" preload="intent">
  Athletes
</Link>
```

- **Step 11.4: Coordinate router + query cache**

In router config, set `defaultPreloadStaleTime: 0` to let TanStack Query control freshness:

```tsx
// src/router.tsx (or wherever router is created)
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0, // Let Query handle staleness
});
```

---

## Task 12: Integration and Cleanup

**Files:**

- Modify: `src/features/dashboard/athlete/index.tsx`
- Delete: `src/features/dashboard/athlete/athlete-form-dialog.tsx` (after migration)
- **Step 12.1: Update AthleteManager imports and state**

```tsx
// New state
const [addDrawerOpen, setAddDrawerOpen] = useState(false);
const [editingAthlete, setEditingAthlete] = useState<AthleteProfileData | null>(
  null
);
const [importOpen, setImportOpen] = useState(false);

// Remove old formOpen state
```

- **Step 12.2: Wire all new components**

```tsx
return (
  <div className="flex h-full flex-col">
    <SiteHeader title="Athletes">
      <Button size="sm" onClick={() => setAddDrawerOpen(true)}>
        <Plus /> Add Athlete
      </Button>
    </SiteHeader>

    <div className="flex-1 overflow-auto p-4">
      <DataTable
        table={table}
        state={tableState}
        actionBar={<AthletesActionBar table={table} onBulkAdd={() => setBulkAddOpen(true)} />}
        addRow={{ label: 'Add athlete', onClick: () => setAddDrawerOpen(true) }}
      >
        <DataTableToolbar table={table} state={tableState}>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download /> Export
          </Button>
          <Button size="sm" onClick={() => setAddDrawerOpen(true)}>
            <Plus /> Add Athlete
          </Button>
        </DataTableToolbar>
      </DataTable>
    </div>

    <AthleteAddDrawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen} />
    <AthleteEditSheet athlete={editingAthlete} onOpenChange={setEditingAthlete} />
    <AthleteImportDialog open={importOpen} onOpenChange={setImportOpen} />
    <DeleteAthleteDialog athlete={deletingAthlete} onClose={() => setDeletingAthlete(null)} />
    <BulkAddToTournamentDialog ... />
  </div>
);
```

- **Step 12.3: Remove old AthleteFormDialog**

Once confirmed working, delete `athlete-form-dialog.tsx`.

- **Step 12.4: Run lint and type check**

```bash
bun run lint
bun run typecheck
```

---

## Open Questions

### Q1: Bulk duplicate handling during multi-add

**Context:** When adding multiple athletes at once, should we run de-dup checks?

**Recommendation:** Skip de-dup for multi-add (speed priority). The backend will still enforce hard-block duplicates (athleteCode + name match) and fail those rows. Users can resolve soft duplicates (same name/affiliation/weight/belt) later via edit. This matches Excel-import workflows where you import first, clean later.

**Consequence:** If a hard-block duplicate is encountered, that specific row fails but others succeed. Show a toast with the count of successful vs failed creates.

**Alternative:** Run de-dup per row but allow "Create Anyway" for the whole batch.

### Q2: Batch create API

**Context:** Current API creates one athlete at a time. Multi-add calls N sequential mutations.

**Recommendation:** Acceptable for MVP. If performance becomes an issue with large batches (50+ athletes), add a `/athleteProfile/createBatch` endpoint.

### Q3: Import validation strictness

**Context:** How strict should import validation be? (e.g., gender must be exactly "M" or "F" vs. accepting "Male"/"Female")

**Recommendation:** Be lenient — normalize common variations (`Male`→`M`, `female`→`F`). Log warnings for unknown values but don't block import.

---

## Risks & Edge Cases

| Risk                           | Mitigation                                                 |
| ------------------------------ | ---------------------------------------------------------- |
| Drawer height on small screens | Set `max-h-[80vh]` and ensure scrollable content area      |
| Multi-add with 20+ rows slow   | Debounce row updates, consider virtualization for 50+ rows |
| xlsx library bundle size       | Dynamic import: `const XLSX = await import('xlsx')`        |
| Column resize not persisting   | Store column widths in localStorage (future enhancement)   |
| Import with missing headers    | Show clear error listing expected headers                  |
| ActionBar z-index conflicts    | ActionBar uses `z-50`, verify no higher z-index overlays   |

---

## Verification Steps

After completing all tasks:

1. **Multi-Add Drawer**

- Opens from "Add Athlete" button
- Default 1 row, can add more
- Rows are draggable/reorderable
- Submit creates all athletes
- Form validates required fields

2. **Edit Sheet**

- Opens from row actions "Edit"
- Pre-fills current values
- Duplicate check only runs if name/code changes
- Save updates athlete

3. **ActionBar**

- Appears when rows selected
- Shows selection count
- "Add to Tournament" opens bulk dialog
- "Export" downloads CSV of selected
- X clears selection

4. **Import/Export**

- Export button downloads all athletes as CSV
- Import accepts .csv and .xlsx
- Import shows error for unsupported file types
- Import shows preview of parsed data

5. **Column Resizing**

- Drag handle visible on hover
- Dragging resizes column
- Works in all DataTables (not just Athletes)

6. **Navigation**

- Athletes link preloads on hover
- Navigation shows pending UI if slow
- Data cached for 30 seconds
- Back/forward preserves filters
