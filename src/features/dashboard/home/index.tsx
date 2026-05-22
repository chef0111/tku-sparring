import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SiteHeader } from '../site-header';
import { DashboardHomeSkeleton } from './components/dashboard-home-skeleton';
import { HubChartsSection } from './components/hub-charts-section';
import { KpiStrip } from './components/kpi-strip';
import { NeedsAttention } from './components/needs-attention';
import { RecentTournamentsSection } from './components/recent-tournaments-section';
import { StatusPipeline } from './components/status-pipeline';
import { useDashboardStats } from './hooks/use-dashboard-stats';
import type { TournamentListItem } from '@/features/dashboard/types';
import type { DataTableRowAction } from '@/types/data-table';
import { Button } from '@/components/ui/button';
import { CreateTournamentDialog } from '@/features/dashboard/tournament/create-tournament-dialog';
import { RenameTournamentDialog } from '@/features/dashboard/tournament/list/components/dialogs/rename-tournament-dialog';
import { DeleteTournamentDialog } from '@/features/dashboard/tournament/list/components/dialogs/delete-tournament-dialog';

export function DashboardHome() {
  const { isPending, stats } = useDashboardStats();
  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] =
    useState<DataTableRowAction<TournamentListItem> | null>(null);

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Dashboard" />

      <div className="relative flex-1 overflow-auto py-6">
        <main className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">
                Operations hub
              </h1>
              <p className="text-muted-foreground">
                Cross-tournament monitoring and setup status
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" data-icon="inline-start" />
              Create Tournament
            </Button>
          </div>

          {isPending ? (
            <DashboardHomeSkeleton />
          ) : (
            <>
              <KpiStrip stats={stats.kpis} />
              <HubChartsSection chartData={stats.chartData} />
              <NeedsAttention items={stats.attentionItems} />
              <StatusPipeline pipeline={stats.pipeline} />
              <RecentTournamentsSection
                tournaments={stats.recentTournaments}
                pending={isPending}
                onRowAction={setRowAction}
              />
            </>
          )}
        </main>
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
