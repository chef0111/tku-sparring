import * as React from 'react';
import { useQueryStates } from 'nuqs';

import { SiteHeader } from '../../site-header';
import { CreateTournamentDialog } from '../create-tournament-dialog';
import { useTournamentsViewMode } from './components/tournaments-toolbar/view-mode-toggle';
import { TournamentsToolbar } from './components/tournaments-toolbar';
import { TournamentsGrid } from './components/tournaments-grid';
import { TournamentsTable } from './components/tournaments-table';
import { getTournamentsTableColumns } from './components/tournaments-table/tournaments-table-columns';
import { RenameTournamentDialog } from './components/dialogs/rename-tournament-dialog';
import { DeleteTournamentDialog } from './components/dialogs/delete-tournament-dialog';
import { useTournamentsManagerQuery } from './hooks/use-tournaments-manager-query';
import type { TournamentListItem } from '@/features/dashboard/types';
import type { DataTableRowAction } from '@/types/data-table';

export function TournamentsListManager() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<TournamentListItem> | null>(null);
  const [viewMode] = useTournamentsViewMode();
  const query = useTournamentsManagerQuery();

  const [, setUrlFilters] = useQueryStates({
    query: { parse: (value) => value, serialize: (v) => v ?? '' },
    status: { parse: (value) => value, serialize: (v) => v ?? '' },
  });

  const columns = React.useMemo(
    () => getTournamentsTableColumns({ onRowAction: setRowAction }),
    []
  );

  const onCreate = React.useCallback(() => setCreateOpen(true), []);
  const onClearFilters = React.useCallback(() => {
    void setUrlFilters({ query: null, status: null });
  }, [setUrlFilters]);

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Tournaments" />

      <div className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-6">
        <TournamentsToolbar onCreate={onCreate} />
        {viewMode === 'grid' ? (
          <TournamentsGrid
            query={query}
            onRowAction={setRowAction}
            onCreate={onCreate}
            onClearFilters={onClearFilters}
            className="pt-2"
          />
        ) : (
          <TournamentsTable columns={columns} query={query} className="pt-2" />
        )}
      </div>

      <CreateTournamentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RenameTournamentDialog
        tournament={
          rowAction?.variant === 'update' ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
      />
      <DeleteTournamentDialog
        tournament={
          rowAction?.variant === 'delete' ? rowAction.row.original : null
        }
        onClose={() => setRowAction(null)}
      />
    </div>
  );
}
