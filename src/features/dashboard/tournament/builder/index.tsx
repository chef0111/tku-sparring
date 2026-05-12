import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { ArrowLeft, Trophy } from 'lucide-react';
import { BuilderShell } from './components/builder-shell';
import { BuilderHeader } from './components/builder-shell/builder-header';
import { BuilderBottomToolbar } from './components/builder-shell/builder-bottom-toolbar';
import { EditTournamentDialog } from './components/dialogs/edit-tournament-dialog';
import { DeleteTournamentDialog } from './components/dialogs/delete-tournament-dialog';
import { AutoAssignAllDialog } from './components/dialogs/auto-assign-all-dialog';
import { LifecycleConfirmDialog } from './components/dialogs/lifecycle-confirm-dialog';
import { useBuilderManagerQuery } from './hooks/use-builder-manager-query';
import { GroupsTab } from './components/groups-tab';
import { BracketsTab } from './brackets/brackets-tab';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import type { LeaseSnapshot } from '@/queries/leases';
import LoadingScreen from '@/components/navigation/loading';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
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

type LeaseEntry = LeaseSnapshot[number];

function TournamentBuilder({
  tournament,
  groups,
  tournamentId,
}: TournamentBuilderProps) {
  const isReadOnly = useTournamentReadOnly(tournamentId);
  const { tab } = useBuilderManagerQuery();
  const [, setTab] = useQueryState('tab', TAB_PARSER);
  const queryClient = useQueryClient();

  const [showEditTournament, setShowEditTournament] = React.useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = React.useState(false);
  const [showAutoAssignAll, setShowAutoAssignAll] = React.useState(false);
  const [lifecycleTarget, setLifecycleTarget] = React.useState<
    'active' | 'completed' | null
  >(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!isReadOnly) return;
    setShowEditTournament(false);
    setShowDeleteTournament(false);
    setShowAutoAssignAll(false);
    setLifecycleTarget(null);
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
  const leaseMap = React.useMemo(() => {
    const map = new Map<string, LeaseEntry>();
    for (const lease of leases ?? []) map.set(lease.groupId, lease);
    return map;
  }, [leases]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tournament'] }),
        queryClient.invalidateQueries({ queryKey: ['group'] }),
        queryClient.invalidateQueries({ queryKey: ['lease'] }),
        queryClient.invalidateQueries({ queryKey: ['tournamentAthlete'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleLifecycle = React.useCallback(() => {
    if (tournament.status === 'draft') {
      setLifecycleTarget('active');
    } else if (tournament.status === 'active') {
      setLifecycleTarget('completed');
    }
  }, [tournament.status]);

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
          isRefreshing={isRefreshing}
          canCompleteTournament={tournament.lifecycle.canComplete}
          onRefresh={handleRefresh}
          onAutoAssignAll={() => setShowAutoAssignAll(true)}
          onLifecycle={handleLifecycle}
          onEditTournament={() => {
            if (!isReadOnly) setShowEditTournament(true);
          }}
          onDeleteTournament={() => {
            if (!isReadOnly) setShowDeleteTournament(true);
          }}
          leasePopoverContent={
            <LeaseSummaryList groups={groups} leaseMap={leaseMap} />
          }
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
      <AutoAssignAllDialog
        open={showAutoAssignAll}
        onOpenChange={setShowAutoAssignAll}
        tournamentId={tournamentId}
        groups={groups}
      />
      {lifecycleTarget !== null && (
        <LifecycleConfirmDialog
          open={lifecycleTarget !== null}
          onOpenChange={(v) => {
            if (!v) setLifecycleTarget(null);
          }}
          target={lifecycleTarget}
          tournamentId={tournamentId}
          tournamentName={tournament.name}
        />
      )}
    </BuilderShell>
  );
}

function leaseToStatusVariant(
  status: LeaseEntry['leaseStatus'] | undefined
): 'online' | 'offline' | 'degraded' | 'maintenance' {
  switch (status) {
    case 'held_by_me':
      return 'online';
    case 'held_by_other':
      return 'degraded';
    case 'pending_takeover':
      return 'maintenance';
    default:
      return 'offline';
  }
}

function leaseHolderLabel(status: LeaseEntry['leaseStatus'] | undefined) {
  switch (status) {
    case 'held_by_me':
      return 'You';
    case 'held_by_other':
      return 'Locked';
    case 'pending_takeover':
      return 'Pending';
    default:
      return 'Free';
  }
}

interface LeaseSummaryListProps {
  groups: Array<GroupData>;
  leaseMap: Map<string, LeaseEntry>;
}

function LeaseSummaryList({ groups, leaseMap }: LeaseSummaryListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground p-3 text-sm">No groups yet.</div>
    );
  }

  return (
    <ul className="max-h-72 divide-y overflow-y-auto py-1">
      {groups.map((group) => {
        const lease = leaseMap.get(group.id);
        const variant = leaseToStatusVariant(lease?.leaseStatus);
        const holder = leaseHolderLabel(lease?.leaseStatus);
        return (
          <li
            key={group.id}
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {group.name}
            </span>
            <Status status={variant} className="gap-1.5">
              <StatusIndicator />
              <StatusLabel className="text-xs">{holder}</StatusLabel>
            </Status>
          </li>
        );
      })}
    </ul>
  );
}
