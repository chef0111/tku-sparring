import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Edit, History } from 'lucide-react';
import { ActivityPanel } from './components/activity-panel';
import { GroupsOverview } from './components/groups-overview';
import { SetupChecklist } from './components/setup-checklist';
import { TournamentKpiRow } from './components/tournament-kpi-row';
import { useTournamentCommandCenter } from './hooks/use-tournament-command-center';
import type {
  GroupData,
  MatchData,
  TournamentData,
} from '@/features/dashboard/types';
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
import { TournamentActivitySheet } from '@/features/dashboard/tournament/tournament-activity-sheet';
import { Spinner } from '@/components/ui/spinner';

type ConfirmStatus = 'active' | 'completed';

interface TournamentViewerProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  matches: Array<MatchData>;
  tournamentId: string;
}

export function TournamentViewer({
  tournament,
  groups,
  matches,
  tournamentId,
}: TournamentViewerProps) {
  const isReadOnly = useTournamentReadOnly(tournamentId);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [confirmStatus, setConfirmStatus] =
    React.useState<ConfirmStatus | null>(null);
  const setStatusMutation = useSetTournamentStatus({
    onSuccess: () => setConfirmStatus(null),
  });

  const commandCenter = useTournamentCommandCenter({
    tournament,
    matches,
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
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setActivityOpen(true)}
          >
            <History data-icon="inline-start" />
            Activity
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/dashboard/tournaments/$id/builder"
              params={{ id: tournamentId }}
            >
              <Edit data-icon="inline-start" />
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
        <main className="mx-auto flex max-w-7xl flex-col gap-6">
          <h1 className="sr-only">{tournament.name} command center</h1>
          {tournament.status === 'active' &&
          tournament.lifecycle.canComplete ? (
            <Alert>
              <CheckCircle2 aria-hidden="true" />
              <AlertTitle>Ready to complete</AlertTitle>
              <AlertDescription>
                Every match has a recorded winner. You can complete this
                tournament when you are ready to lock the workspace.
              </AlertDescription>
            </Alert>
          ) : null}

          {tournament.status === 'draft' &&
          commandCenter.setupSteps.length > 0 ? (
            <SetupChecklist
              steps={commandCenter.setupSteps}
              tournamentId={tournamentId}
            />
          ) : null}

          <TournamentKpiRow tournament={tournament} groups={groups} />

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <GroupsOverview groups={groups} tournamentId={tournamentId} />
            </div>
            <div className="lg:col-span-2">
              <ActivityPanel
                tournamentId={tournamentId}
                onViewAll={() => setActivityOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      <TournamentActivitySheet
        tournamentId={tournamentId}
        open={activityOpen}
        onOpenChange={setActivityOpen}
      />

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
              {setStatusMutation.isPending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  <span>Saving…</span>
                </>
              ) : (
                (transitionAction?.label ?? 'Confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
