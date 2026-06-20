import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { TournamentListItem } from '@/contracts/tournament/list';
import type { DataTableRowAction } from '@/types/data-table';
import { CreateTournamentDialog } from '@/features/dashboard/components/tournament/create-tournament-dialog';
import { DeleteTournamentDialog } from '@/features/dashboard/components/tournament/overview/dialogs/delete-tournament-dialog';
import { RenameTournamentDialog } from '@/features/dashboard/components/tournament/overview/dialogs/rename-tournament-dialog';
import { DashboardHomeSkeleton } from '@/features/dashboard/components/home/dashboard-home-skeleton';
import { HubChartsSection } from '@/features/dashboard/components/home/hub-charts-section';
import { KpiStrip } from '@/features/dashboard/components/home/kpi-strip';
import { RecentTournamentsSection } from '@/features/dashboard/components/home/recent-tournaments-section';
import { StatusPipeline } from '@/features/dashboard/components/home/status-pipeline';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { SiteHeader } from '@/features/dashboard/components/sidebar/site-header';
import { Button } from '@/components/ui/button';

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
              <StatusPipeline
                pipeline={stats.pipeline}
                statusCounts={stats.kpis.byStatus}
              />
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
