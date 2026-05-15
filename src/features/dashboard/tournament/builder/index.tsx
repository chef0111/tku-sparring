import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';
import { BuilderShell } from './components/builder-shell';
import { BuilderHeader } from './components/builder-shell/builder-header';
import { BuilderBottomToolbar } from './components/builder-shell/builder-bottom-toolbar';
import { EditTournamentDialog } from './components/dialogs/edit-tournament-dialog';
import { DeleteTournamentDialog } from './components/dialogs/delete-tournament-dialog';
import { AutoAssignAllDialog } from './components/dialogs/auto-assign-all-dialog';
import { LifecycleConfirmDialog } from './components/dialogs/lifecycle-confirm-dialog';
import { GroupsTab } from './components/groups-tab';
import { BracketsTab } from './components/brackets-tab';
import { useTournamentBuilder } from './hooks/use-tournament-builder';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import { TournamentActivitySheet } from '@/features/dashboard/tournament/tournament-activity-sheet';
import LoadingScreen from '@/components/navigation/loading';
import { Button } from '@/components/ui/button';
import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';
import { useTournament } from '@/queries/tournaments';
import { useGroups } from '@/queries/groups';

interface TournamentBuilderPageProps {
  id: string;
}

export function TournamentBuilderPage({ id }: TournamentBuilderPageProps) {
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
  const b = useTournamentBuilder({ tournament, groups, tournamentId });

  return (
    <BuilderShell
      readOnly={b.isReadOnly}
      header={
        <BuilderHeader
          tournament={tournament}
          tab={b.tab}
          onTabChange={(v) => void b.setTab(v)}
          user={b.user}
        />
      }
      footer={
        <BuilderBottomToolbar
          tournament={tournament}
          readOnly={b.isReadOnly}
          isRefreshing={b.isRefreshing}
          canCompleteTournament={tournament.lifecycle.canComplete}
          onRefresh={b.handleRefresh}
          onAutoAssignAll={() => b.setShowAutoAssignAll(true)}
          onLifecycle={b.handleLifecycle}
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
      <div className="relative flex-1 overflow-hidden">
        {b.tab === 'groups' ? (
          <GroupsTab
            tournamentId={tournamentId}
            groups={groups}
            readOnly={b.isReadOnly}
          />
        ) : (
          <BracketsTab
            tournamentId={tournamentId}
            groups={groups}
            readOnly={b.isReadOnly}
            tournamentStatus={tournament.status}
          />
        )}
      </div>

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
      {b.lifecycleTarget !== null && (
        <LifecycleConfirmDialog
          open={b.lifecycleTarget !== null}
          onOpenChange={(v) => {
            if (!v) b.setLifecycleTarget(null);
          }}
          target={b.lifecycleTarget}
          tournamentId={tournamentId}
          tournamentName={tournament.name}
        />
      )}
    </BuilderShell>
  );
}
