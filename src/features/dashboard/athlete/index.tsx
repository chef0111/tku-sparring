import React from 'react';
import { SiteHeader } from '../site-header';
import { AthleteAddDrawer } from './components/athlete-add-drawer';
import { AthleteEditSheet } from './components/athlete-edit-sheet';
import { AthleteTable } from './components/athlete-table';
import { AthleteImportDialog } from './components/dialogs/athlete-import-dialog';
import { DeleteAthleteDialog } from './components/dialogs/delete-athlete-dialog';
import { getAthletesTableColumns } from './components/athlete-table/athletes-table-columns';
import type { AthleteProfileData } from '../types';
import type { DataTableRowAction } from '@/types/data-table';
import { FeatureFlagsProvider } from '@/contexts/feature-flags';

export default function AthletesManager() {
  const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AthleteProfileData> | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  const columns = React.useMemo(
    () =>
      getAthletesTableColumns({
        onRowAction: setRowAction,
      }),
    []
  );

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes" />
      <div className="p-4">
        <FeatureFlagsProvider>
          <AthleteTable
            columns={columns}
            className="pt-6"
            onAdd={() => setAddDrawerOpen(true)}
            onImport={() => setImportOpen(true)}
          />
        </FeatureFlagsProvider>
      </div>

      <AthleteAddDrawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen} />
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
