import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  CheckCircle2,
  Edit,
  Layers,
  LayoutGrid,
  Trophy,
  Users,
} from 'lucide-react';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import { SiteHeader } from '@/features/dashboard/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTournamentReadOnly } from '@/hooks/use-tournament-read-only';
import { useSetTournamentStatus } from '@/queries/tournaments';
import { TournamentStatusPill } from '@/features/dashboard/tournament/list/components/tournament-status-pill';

type ConfirmStatus = 'active' | 'completed';

interface TournamentViewerProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  tournamentId: string;
}

export function TournamentViewer({
  tournament,
  groups,
  tournamentId,
}: TournamentViewerProps) {
  const isReadOnly = useTournamentReadOnly(tournamentId);
  const [confirmStatus, setConfirmStatus] =
    React.useState<ConfirmStatus | null>(null);
  const setStatusMutation = useSetTournamentStatus({
    onSuccess: () => setConfirmStatus(null),
  });

  const transitionAction =
    tournament.status === 'draft'
      ? {
          status: 'active' as const,
          label: 'Activate',
          title: 'Activate tournament',
          description:
            'This will move the tournament into the active state so live results can begin.',
        }
      : tournament.status === 'active' && tournament.lifecycle.canComplete
        ? {
            status: 'completed' as const,
            label: 'Complete tournament',
            title: 'Complete tournament',
            description:
              'This will mark the tournament as completed and make the tournament workspace read-only.',
          }
        : null;

  return (
    <div className="flex h-full flex-col">
      <SiteHeader
        title={
          <Link
            to="/dashboard/tournaments"
            className="text-muted-foreground hover:text-foreground"
          >
            Tournaments
          </Link>
        }
        action={tournament.name}
      >
        <div className="ml-auto flex items-center gap-2">
          <TournamentStatusPill status={tournament.status} />
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/dashboard/tournaments/$id/builder"
              params={{ id: tournamentId }}
            >
              <Edit className="mr-1 size-4" />
              {isReadOnly ? 'Open Builder' : 'Edit Tournament'}
            </Link>
          </Button>
          {transitionAction ? (
            <Button
              size="sm"
              onClick={() => setConfirmStatus(transitionAction.status)}
            >
              {transitionAction.label}
            </Button>
          ) : null}
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {tournament.status === 'active' &&
          tournament.lifecycle.canComplete ? (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertTitle>Ready to complete</AlertTitle>
              <AlertDescription>
                All groups have winner results. You can complete this tournament
                when you are ready to lock the workspace.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Layers}
              label="Groups"
              value={tournament._count.groups}
            />
            <StatCard
              icon={Users}
              label="Athletes"
              value={tournament._count.tournamentAthletes}
            />
            <StatCard
              icon={Trophy}
              label="Matches"
              value={tournament._count.matches}
            />
          </div>

          {/* Athletes per group */}
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <LayoutGrid className="text-muted-foreground mb-4 size-10" />
                <p className="text-muted-foreground text-sm">
                  No groups yet. Switch to builder mode to add groups.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                  >
                    Open Builder
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground text-sm">
                  Select a group to view athletes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={confirmStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmStatus(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transitionAction?.title ?? 'Update status'}
            </DialogTitle>
            <DialogDescription>
              {transitionAction?.description ??
                'Confirm the next tournament lifecycle transition.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmStatus(null)}
              disabled={setStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirmStatus) {
                  return;
                }

                setStatusMutation.mutate({
                  id: tournamentId,
                  status: confirmStatus,
                });
              }}
              disabled={setStatusMutation.isPending}
            >
              {setStatusMutation.isPending
                ? 'Saving...'
                : (transitionAction?.label ?? 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
