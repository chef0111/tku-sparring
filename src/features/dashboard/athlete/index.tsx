import * as React from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { AthleteAddDrawer } from './components/athlete-add-drawer';
import { AthleteEditSheet } from './components/athlete-edit-sheet';
import { AthleteImportDialog } from './components/dialogs/athlete-import-dialog';
import { AthletesActionBar } from './components/athletes-action-bar';
import { BulkAddToTournamentDialog } from './components/dialogs/bulk-add-to-tournament-dialog';
import { DeleteAthleteDialog } from './components/dialogs/delete-athlete-dialog';
import { getAthletesTableColumns } from './components/athletes-table-columns';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/features/dashboard/site-header';
import { useDataTable } from '@/hooks/use-data-table';
import { exportTableToCSV } from '@/lib/data-table/export';
import { getSortingStateParser } from '@/lib/data-table/parsers';
import { useAthleteProfiles } from '@/queries/athlete-profiles';
import { parseRangeParam } from '@/lib/data-table/utils';

const SORTABLE_COLUMN_IDS = new Set([
  'name',
  'beltLevel',
  'weight',
  'affiliation',
  'createdAt',
]);

export function AthleteManager() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [nameFilter] = useQueryState('name');
  const [genderFilter] = useQueryState(
    'gender',
    parseAsArrayOf(parseAsString, ',')
  );
  const [affiliationFilter] = useQueryState('affiliation');
  const [beltFilter] = useQueryState('beltLevel');
  const [weightFilter] = useQueryState('weight');
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<AthleteProfileData>(SORTABLE_COLUMN_IDS).withDefault(
      []
    )
  );

  const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);
  const [editingAthlete, setEditingAthlete] =
    React.useState<AthleteProfileData | null>(null);
  const [deletingAthlete, setDeletingAthlete] =
    React.useState<AthleteProfileData | null>(null);
  const [bulkAddOpen, setBulkAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const beltRange = parseRangeParam(beltFilter);
  const weightRange = parseRangeParam(weightFilter);

  const { data } = useAthleteProfiles({
    page,
    perPage,
    name: nameFilter ?? undefined,
    gender: (genderFilter?.[0] as 'M' | 'F') ?? undefined,
    affiliation: affiliationFilter ?? undefined,
    beltLevelMin: beltRange?.[0],
    beltLevelMax: beltRange?.[1],
    weightMin: weightRange?.[0],
    weightMax: weightRange?.[1],
    sort: sort?.[0]?.id ?? undefined,
    sortDir: sort?.[0]?.desc ? 'desc' : 'asc',
  });

  const columns = React.useMemo(
    () =>
      getAthletesTableColumns({
        onEdit: setEditingAthlete,
        onDelete: setDeletingAthlete,
      }),
    [setEditingAthlete, setDeletingAthlete]
  );

  const { table, state: tableState } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / perPage),
    shallow: true,
    clearOnDefault: true,
  });

  const currentItemIds = React.useMemo(
    () => new Set((data?.items ?? []).map((athlete) => athlete.id)),
    [data?.items]
  );
  const selectedIds = React.useMemo(
    () =>
      Object.keys(tableState.rowSelection).filter((id) =>
        currentItemIds.has(id)
      ),
    [tableState.rowSelection, currentItemIds]
  );

  function handleExportAll() {
    exportTableToCSV(table, {
      filename: 'athletes',
      excludeColumns: ['select', 'actions'],
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
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes">
        <div className="ml-auto pr-4">
          <Button size="sm" onClick={() => setAddDrawerOpen(true)}>
            <Plus className="mr-1 size-4" />
            Add Athlete
          </Button>
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-4">
        <DataTable
          table={table}
          state={tableState}
          actionBar={
            <AthletesActionBar
              table={table}
              onBulkAdd={() => setBulkAddOpen(true)}
            />
          }
          addRow={{
            label: 'Add athlete',
            onClick: () => setAddDrawerOpen(true),
          }}
        >
          <DataTableToolbar table={table} state={tableState}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1 size-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="mr-1 size-4" />
              Export
            </Button>
          </DataTableToolbar>
        </DataTable>
      </div>

      <AthleteAddDrawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen} />
      <AthleteEditSheet
        athlete={editingAthlete}
        onOpenChange={setEditingAthlete}
      />
      <AthleteImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeleteAthleteDialog
        athlete={deletingAthlete}
        onClose={() => setDeletingAthlete(null)}
      />
      <BulkAddToTournamentDialog
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
        athleteProfileIds={selectedIds}
        onSuccess={() => table.resetRowSelection()}
      />
    </div>
  );
}
