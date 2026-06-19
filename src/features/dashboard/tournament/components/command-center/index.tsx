import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  History,
  Trophy,
  ZapIcon,
} from 'lucide-react';
import { TournamentActivitySheet } from '../tournament-activity-sheet';
import { TournamentStatusPill } from '../tournament-status-pill';
import { useTournamentCommandCenter } from '../../hooks/use-tournament-command-center';
import { ActivityPanel } from './activity-panel';
import { GroupsOverview } from './groups-overview';
import { SetupChecklist } from './setup-checklist';
import { TournamentKpiRow } from './tournament-kpi-row';
import { TournamentStatusDialog } from './tournament-status-dialog';
import {
  GroupsOverviewSkeleton,
  HeaderControlsSkeleton,
  SetupChecklistSkeleton,
  TournamentCommandCenterHeaderActionSkeleton,
  TournamentKpiRowSkeleton,
} from './loading';
import type { TournamentStatus } from './tournament-status-dialog';
import type {
  GroupData,
  MatchData,
  TournamentData,
} from '@/features/dashboard/types';
import { SiteHeader } from '@/features/dashboard/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTournamentReadOnly } from '@/hooks/use-tournament-read-only';
import { useGroups } from '@/queries/group';
import { useTournamentMatches } from '@/queries/match';
import { useTournament } from '@/queries/tournament';

interface TournamentCommandCenterProps {
  tournamentId: string;
}

export function TournamentCommandCenter({
  tournamentId,
}: TournamentCommandCenterProps) {
  const tournamentQuery = useTournament(tournamentId);
  const groupsQuery = useGroups(tournamentId);
  const matchesQuery = useTournamentMatches(tournamentId);

  const tournament = tournamentQuery.data as TournamentData | undefined;
  const groups = (groupsQuery.data ?? []) as Array<GroupData>;
  const matches = (matchesQuery.data ?? []) as Array<MatchData>;

  const isTournamentPending = tournamentQuery.isPending;
  const isGroupsPending = groupsQuery.isPending;
  const isMatchesPending = matchesQuery.isPending;

  const isReadOnly = useTournamentReadOnly(tournamentId);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [confirmStatus, setConfirmStatus] =
    React.useState<TournamentStatus | null>(null);

  const commandCenter = useTournamentCommandCenter({
    tournament,
    matches,
  });

  if (tournamentQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Trophy className="text-muted-foreground size-12" />
        <h2 className="text-lg font-semibold">Tournament not found</h2>
        <Button variant="outline" asChild>
          <Link to="/dashboard/tournaments">
            <ArrowLeft />
            Back to tournaments
          </Link>
        </Button>
      </div>
    );
  }

  const transitionAction =
    tournament?.status === 'draft'
      ? {
          status: 'active' as const,
          label: 'Activate',
          title: 'Activate tournament',
          description:
            'This will move the tournament into the active state so live results can begin.',
        }
      : tournament?.status === 'active' && tournament.lifecycle.canComplete
        ? {
            status: 'completed' as const,
            label: 'Complete tournament',
            title: 'Complete tournament',
            description:
              'This will mark the tournament as completed and make the tournament workspace read-only.',
          }
        : null;

  const isDraft = tournament?.status === 'draft';

  const showSetupChecklistSkeleton =
    isTournamentPending || (isDraft && isMatchesPending);

  const showSetupChecklist =
    !isTournamentPending &&
    !isMatchesPending &&
    isDraft &&
    commandCenter.setupSteps.length > 0;

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
        action={
          isTournamentPending ? (
            <TournamentCommandCenterHeaderActionSkeleton />
          ) : (
            tournament!.name
          )
        }
      >
        {isTournamentPending ? (
          <HeaderControlsSkeleton />
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <TournamentStatusPill status={tournament!.status} />
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
            {transitionAction && (
              <Button
                size="sm"
                onClick={() => setConfirmStatus(transitionAction.status)}
              >
                <ZapIcon aria-hidden="true" />
                {transitionAction.label}
              </Button>
            )}
          </div>
        )}
      </SiteHeader>

      <div className="flex-1 overflow-auto p-6">
        <main className="mx-auto flex max-w-7xl flex-col gap-6">
          {!isTournamentPending && tournament && (
            <h1 className="sr-only">{tournament.name} command center</h1>
          )}

          {!isTournamentPending &&
            tournament?.status === 'active' &&
            tournament.lifecycle.canComplete && (
              <Alert>
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Ready to complete</AlertTitle>
                <AlertDescription>
                  Every match has a recorded winner. You can complete this
                  tournament when you are ready to lock the workspace.
                </AlertDescription>
              </Alert>
            )}

          {showSetupChecklistSkeleton ? (
            <SetupChecklistSkeleton />
          ) : showSetupChecklist ? (
            <SetupChecklist
              steps={commandCenter.setupSteps}
              tournamentId={tournamentId}
            />
          ) : null}

          {isTournamentPending ? (
            <TournamentKpiRowSkeleton />
          ) : (
            <TournamentKpiRow
              tournament={tournament!}
              groups={groups}
              matches={matches}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              {isGroupsPending ? (
                <GroupsOverviewSkeleton />
              ) : (
                <GroupsOverview
                  groups={groups}
                  matches={matches}
                  tournamentId={tournamentId}
                />
              )}
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

      {!isTournamentPending && tournament && (
        <TournamentStatusDialog
          tournamentId={tournamentId}
          confirmStatus={confirmStatus}
          onConfirmStatusChange={setConfirmStatus}
          transitionAction={transitionAction}
        />
      )}
    </div>
  );
}
