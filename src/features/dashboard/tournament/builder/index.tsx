import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { ArrowLeft, Trophy } from 'lucide-react';
import { BuilderShell } from './components/builder-shell';
import { BuilderHeader } from './components/builder-shell/builder-header';
import { BuilderBottomToolbar } from './components/builder-shell/builder-bottom-toolbar';
import { EditTournamentDialog } from './components/dialogs/edit-tournament-dialog';
import { DeleteTournamentDialog } from './components/dialogs/delete-tournament-dialog';
import { useBuilderManagerQuery } from './hooks/use-builder-manager-query';
import { GroupsTab } from './components/groups-tab';
import { BracketsTab } from './brackets/brackets-tab';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import LoadingScreen from '@/components/navigation/loading';
import { Button } from '@/components/ui/button';
import { useLeaseStream } from '@/hooks/use-lease-stream';
import { useTournamentReadOnly } from '@/hooks/use-tournament-read-only';
import { useTournament } from '@/queries/tournaments';
import { useGroups } from '@/queries/groups';
import { useLeases } from '@/queries/leases';
import { useDeviceId } from '@/hooks/use-device-id';
import { authClient } from '@/lib/auth-client';

interface TournamentBuilderPageProps {
  id: string;
}

export function TournamentBuilderPage({ id }: TournamentBuilderPageProps) {
  useLeaseStream(id);

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
    <TournamentBuilder
      tournament={tournament}
      groups={groups as Array<GroupData>}
      tournamentId={id}
    />
  );
}

interface TournamentBuilderProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  tournamentId: string;
}

const TAB_PARSER = parseAsStringEnum(['groups', 'brackets']).withDefault(
  'groups'
);

function TournamentBuilder({
  tournament,
  groups,
  tournamentId,
}: TournamentBuilderProps) {
  const isReadOnly = useTournamentReadOnly(tournamentId);
  const { tab } = useBuilderManagerQuery();
  const [, setTab] = useQueryState('tab', TAB_PARSER);

  const [showEditTournament, setShowEditTournament] = React.useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = React.useState(false);

  React.useEffect(() => {
    if (!isReadOnly) return;
    setShowEditTournament(false);
    setShowDeleteTournament(false);
  }, [isReadOnly]);

  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user;

  const deviceId = useDeviceId();
  const { data: leases } = useLeases(tournamentId, deviceId);
  const leasedByMeCount = React.useMemo(
    () =>
      (leases ?? []).filter((lease) => lease.leaseStatus === 'held_by_me')
        .length,
    [leases]
  );

  return (
    <BuilderShell
      readOnly={isReadOnly}
      header={
        <BuilderHeader
          tournament={tournament}
          tab={tab}
          onTabChange={(v) => void setTab(v)}
          user={user}
        />
      }
      footer={
        <BuilderBottomToolbar
          tournament={tournament}
          leasedByMeCount={leasedByMeCount}
          totalGroups={groups.length}
          readOnly={isReadOnly}
          onEditTournament={() => {
            if (!isReadOnly) setShowEditTournament(true);
          }}
          onDeleteTournament={() => {
            if (!isReadOnly) setShowDeleteTournament(true);
          }}
        />
      }
    >
      <div className="relative flex-1 overflow-hidden p-4">
        {tab === 'groups' ? (
          <GroupsTab
            tournamentId={tournamentId}
            groups={groups}
            readOnly={isReadOnly}
          />
        ) : (
          <BracketsTab
            tournamentId={tournamentId}
            groups={groups}
            readOnly={isReadOnly}
            tournamentStatus={tournament.status}
          />
        )}
      </div>

      <EditTournamentDialog
        open={showEditTournament}
        onOpenChange={setShowEditTournament}
        tournamentId={tournamentId}
        currentName={tournament.name}
      />
      <DeleteTournamentDialog
        open={showDeleteTournament}
        onOpenChange={setShowDeleteTournament}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
      />
    </BuilderShell>
  );
}
