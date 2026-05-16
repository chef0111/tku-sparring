import React from 'react';
import { Plus } from 'lucide-react';
import { SiteHeader } from '../site-header';
import { AthleteDrawer } from './components/athlete-drawer';
import { AthleteEditSheet } from './components/athlete-table/athlete-edit-sheet';
import { AthleteTable } from './components/athlete-table';
import { AthleteImportDialog } from './components/dialogs/athlete-import-dialog';
import { DeleteAthleteDialog } from './components/dialogs/delete-athlete-dialog';
import { getAthletesTableColumns } from './components/athlete-table/athletes-table-columns';
import { athleteProfileToRow } from './lib/athlete-profile-to-row';
import type { AthleteDrawerMode } from './components/athlete-drawer';
import type { AthleteProfileData, AthleteRow } from '../types';
import type { DataTableRowAction } from '@/types/data-table';
import { FeatureFlagsProvider } from '@/contexts/feature-flags';
import { Button } from '@/components/ui/button';

export default function AthletesManager() {
  const enableQueryFilter = true;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] =
    React.useState<AthleteDrawerMode>('create');
  const [drawerSeedRows, setDrawerSeedRows] =
    React.useState<Array<AthleteRow> | null>(null);
  const bulkEditCompleteRef = React.useRef<(() => void) | null>(null);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AthleteProfileData> | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  const columns = React.useMemo(
    () =>
      getAthletesTableColumns({
        onRowAction: setRowAction,
        nameFilterQueryKey: enableQueryFilter ? 'query' : 'name',
      }),
    [enableQueryFilter]
  );

  function openCreateDrawer() {
    setDrawerMode('create');
    setDrawerSeedRows(null);
    bulkEditCompleteRef.current = null;
    setDrawerOpen(true);
  }

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) {
      setDrawerMode('create');
      setDrawerSeedRows(null);
      bulkEditCompleteRef.current = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes">
        <div className="ml-auto pr-4">
          <Button size="sm" onClick={openCreateDrawer}>
            <Plus className="mr-1 size-4" />
            Add Athlete
          </Button>
        </div>
      </SiteHeader>

      <div className="mx-auto w-full max-w-7xl p-6">
        <FeatureFlagsProvider>
          <AthleteTable
            columns={columns}
            className="pt-6"
            onAdd={openCreateDrawer}
            onImport={() => setImportOpen(true)}
            enableQueryFilter={enableQueryFilter}
            onBulkEdit={(profiles, onComplete) => {
              setDrawerSeedRows(profiles.map(athleteProfileToRow));
              setDrawerMode('bulk-edit');
              bulkEditCompleteRef.current = onComplete;
              setDrawerOpen(true);
            }}
          />
        </FeatureFlagsProvider>
      </div>

      <AthleteDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        seedRows={drawerSeedRows}
        onBulkEditSaved={() => bulkEditCompleteRef.current?.()}
      />
      <AthleteEditSheet
        athlete={
          rowAction?.variant === 'update' ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
      />
      <AthleteImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeleteAthleteDialog
        athlete={
          rowAction?.variant === 'delete' ? rowAction.row.original : null
        }
        onClose={() => setRowAction(null)}
      />
    </div>
  );
}
