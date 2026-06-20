import { Link } from '@tanstack/react-router';
import * as React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import {
  BracketChromeProvider,
  useBracketChrome,
} from '../../contexts/bracket-chrome';
import { BuilderWorkspaceProvider } from '../../contexts/builder-workspace';
import { useTournamentBuilder } from '../../hooks/use-tournament-builder';
import { TournamentBracketProvider } from '../../contexts/tournament-bracket';
import { TournamentActivitySheet } from '../tournament-activity-sheet';
import { BuilderShell } from './builder-shell';
import { BuilderHeader } from './builder-shell/builder-header';
import { BuilderFooter } from './builder-shell/builder-footer';
import { EditTournamentDialog } from './dialogs/edit-tournament-dialog';
import { DeleteTournamentDialog } from './dialogs/delete-tournament-dialog';
import { AutoAssignAllDialog } from './dialogs/auto-assign-all-dialog';
import { TournamentStatusDialog } from './dialogs/tournament-status-dialog';
import { GroupsTab } from './groups-tab';
import { BracketsTab } from './brackets-tab';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import LoadingScreen from '@/components/navigation/loading';
import { Button } from '@/components/ui/button';
import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';
import { useSetTournamentStatus, useTournament } from '@/queries/tournament';
import { useGroups } from '@/queries/group';

interface TournamentBuilderProps {
  id: string;
}

export function TournamentBuilder({ id }: TournamentBuilderProps) {
  useTournamentRealtimeStream(id);

  const tournamentQuery = useTournament(id);
  const groupsQuery = useGroups(id);

  if (tournamentQuery.isPending) {
    return <LoadingScreen title="Loading workspace..." />;
  }

  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
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

  const tournament = tournamentQuery.data as TournamentData;
  const groups = groupsQuery.data ?? [];

  return (
    <TournamentBuilderActive
      tournament={tournament}
      groups={groups as Array<GroupData>}
      tournamentId={id}
    />
  );
}

interface TournamentBuilderActiveProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  tournamentId: string;
}

function TournamentBuilderActive({
  tournament,
  groups,
  tournamentId,
}: TournamentBuilderActiveProps) {
  return (
    <BracketChromeProvider>
      <TournamentBuilderActiveBody
        tournament={tournament}
        groups={groups}
        tournamentId={tournamentId}
      />
    </BracketChromeProvider>
  );
}

function TournamentBuilderActiveBody({
  tournament,
  groups,
  tournamentId,
}: TournamentBuilderActiveProps) {
  const b = useTournamentBuilder({ tournament, groups, tournamentId });
  const { exitFullscreen } = useBracketChrome();

  React.useEffect(() => {
    if (b.tab !== 'brackets') exitFullscreen();
  }, [b.tab, exitFullscreen]);

  const setTournamentStatusMutation = useSetTournamentStatus({
    onSuccess: () => b.setPendingAdminStatus(null),
  });

  return (
    <BuilderShell
      readOnly={b.isReadOnly}
      header={
        <BuilderHeader
          tournament={tournament}
          tab={b.tab}
          onTabChange={(v) => {
            if (v === 'groups') exitFullscreen();
            void b.setTab(v);
          }}
          user={b.user}
        />
      }
      footer={
        <BuilderFooter
          tournament={tournament}
          readOnly={b.isReadOnly}
          isRefreshing={b.isRefreshing}
          isSettingTournamentStatus={setTournamentStatusMutation.isPending}
          onRefresh={b.handleRefresh}
          onAutoAssignAll={() => b.setShowAutoAssignAll(true)}
          onAdminStatusIntent={b.handleAdminStatusIntent}
          onEditTournament={() => {
            if (!b.isReadOnly) b.setShowEditTournament(true);
          }}
          onDeleteTournament={() => {
            if (!b.isReadOnly) b.setShowDeleteTournament(true);
          }}
          onActivity={() => b.setActivityOpen(true)}
        />
      }
    >
      <BuilderWorkspaceProvider
        tournamentId={tournamentId}
        groups={groups}
        readOnly={b.isReadOnly}
        tournamentStatus={tournament.status}
      >
        <div className="relative flex-1 overflow-hidden">
          {b.tab === 'groups' ? (
            <GroupsTab
              tournamentId={tournamentId}
              tournamentName={tournament.name}
              groups={groups}
              readOnly={b.isReadOnly}
            />
          ) : (
            <TournamentBracketProvider>
              <BracketsTab />
            </TournamentBracketProvider>
          )}
        </div>
      </BuilderWorkspaceProvider>

      <TournamentActivitySheet
        open={b.activityOpen}
        onOpenChange={b.setActivityOpen}
        tournamentId={tournamentId}
      />
      <EditTournamentDialog
        open={b.showEditTournament}
        onOpenChange={b.setShowEditTournament}
        tournamentId={tournamentId}
        currentName={tournament.name}
      />
      <DeleteTournamentDialog
        open={b.showDeleteTournament}
        onOpenChange={b.setShowDeleteTournament}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
      />
      <AutoAssignAllDialog
        open={b.showAutoAssignAll}
        onOpenChange={b.setShowAutoAssignAll}
        tournamentId={tournamentId}
        groups={groups}
      />
      <TournamentStatusDialog
        open={b.pendingAdminStatus !== null}
        onOpenChange={(open) => {
          if (!open) b.setPendingAdminStatus(null);
        }}
        tournamentName={tournament.name}
        fromStatus={tournament.status}
        toStatus={b.pendingAdminStatus}
        isPending={setTournamentStatusMutation.isPending}
        onConfirm={() => {
          if (!b.pendingAdminStatus) return;
          setTournamentStatusMutation.mutate({
            id: tournamentId,
            status: b.pendingAdminStatus,
            force: true,
          });
        }}
      />
    </BuilderShell>
  );
}
