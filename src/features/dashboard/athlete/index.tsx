'use client';

import * as React from 'react';
import { Plus, Trophy, UserPlus } from 'lucide-react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { AthleteFormDialog } from './athlete-form-dialog';
import { BulkAddToTournamentDialog } from './bulk-add-to-tournament-dialog';
import { DeleteAthleteDialog } from './delete-athlete-dialog';
import { getAthletesTableColumns } from './athletes-table-columns';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/features/dashboard/site-header';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { useAthleteProfiles } from '@/queries/athlete-profiles';

function parseRangeParam(value: string | null): [number, number] | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return undefined;
}

const SORTABLE_COLUMN_IDS = new Set([
  'name',
  'beltLevel',
  'weight',
  'affiliation',
  'createdAt',
]);

export function AthleteManager() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
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

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingAthlete, setEditingAthlete] =
    React.useState<AthleteProfileData | null>(null);
  const [deletingAthlete, setDeletingAthlete] =
    React.useState<AthleteProfileData | null>(null);
  const [bulkAddOpen, setBulkAddOpen] = React.useState(false);

  const beltRange = parseRangeParam(beltFilter);
  const weightRange = parseRangeParam(weightFilter);

  const { data, isFetching } = useAthleteProfiles({
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
    []
  );

  const { table, state: tableState } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / perPage),
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

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes">
        <div className="ml-auto pr-4">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 size-4" />
            Add Athlete
          </Button>
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-4">
        {isFetching && !data ? (
          <DataTableSkeleton columnCount={7} rowCount={10} />
        ) : data?.total === 0 &&
          !nameFilter &&
          !genderFilter &&
          !affiliationFilter &&
          !beltFilter &&
          !weightFilter ? (
          <EmptyState onAdd={() => setFormOpen(true)} />
        ) : (
          <DataTable
            table={table}
            state={tableState}
            actionBar={
              selectedIds.length > 0 ? (
                <div className="bg-background flex items-center gap-2 rounded-md border px-3 py-2 shadow-sm">
                  <span className="text-muted-foreground text-sm">
                    {selectedIds.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkAddOpen(true)}
                  >
                    <UserPlus className="mr-1 size-4" />
                    Add to Tournament
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => table.resetRowSelection()}
                  >
                    Clear
                  </Button>
                </div>
              ) : undefined
            }
          >
            <DataTableToolbar table={table} state={tableState}>
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1 size-4" />
                Add Athlete
              </Button>
            </DataTableToolbar>
          </DataTable>
        )}
      </div>

      <AthleteFormDialog
        open={formOpen || !!editingAthlete}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingAthlete(null);
          }
        }}
        athlete={editingAthlete ?? undefined}
      />

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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Trophy className="text-muted-foreground mb-4 size-12" />
      <h3 className="text-lg font-semibold">No athletes yet</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Add athletes to the global registry to get started.
      </p>
      <Button variant="outline" onClick={onAdd}>
        <Plus className="mr-2 size-4" />
        Add Athlete
      </Button>
    </div>
  );
}
