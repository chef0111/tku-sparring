import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';
import { TournamentStatusPill } from '../list/components/tournament-status-pill';
import { BuilderSidebar } from './sidebar';
import {
  AddGroupDialog,
  DeleteTournamentDialog,
  EditTournamentDialog,
} from './dialogs';
import { Header } from './header';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from '@/components/navigation/loading';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useLeaseStream } from '@/hooks/use-lease-stream';
import { useTournamentReadOnly } from '@/hooks/use-tournament-read-only';
import { useTournament } from '@/queries/tournaments';
import { useGroups } from '@/queries/groups';
import { UserDropdown } from '@/components/user/user-dropdown';
import { authClient } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { ButtonGroupSeparator } from '@/components/ui/button-group';

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

function TournamentBuilder({
  tournament,
  groups,
  tournamentId,
}: TournamentBuilderProps) {
  const isReadOnly = useTournamentReadOnly(tournamentId);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    groups[0]?.id ?? null
  );
  const [showAddGroup, setShowAddGroup] = React.useState(false);
  const [showEditTournament, setShowEditTournament] = React.useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = React.useState(false);

  // When groups list changes (e.g. after creation), auto-select the first if no selection
  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]?.id ?? null);
    }
    // If the selected group was deleted, reset
    if (selectedGroupId && !groups.find((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0]?.id ?? null);
    }
  }, [groups, selectedGroupId]);

  React.useEffect(() => {
    if (!isReadOnly) {
      return;
    }

    setShowAddGroup(false);
    setShowEditTournament(false);
    setShowDeleteTournament(false);
  }, [isReadOnly]);

  const { data } = authClient.useSession();
  const user = data?.user;

  return (
    <SidebarProvider defaultOpen>
      <Header>
        <div className="relative flex w-full items-center">
          <SidebarTrigger className="bg-muted/70 hover:bg-accent! z-50 border" />
          <h1 className="ml-2 text-lg font-semibold">{tournament.name}</h1>
          <Badge className="bg-primary/10 text-primary ml-1 rounded text-xs font-medium">
            Builder
          </Badge>
          <TournamentStatusPill status={tournament.status} className="ml-2" />
        </div>
        <Tabs
          defaultValue="groups"
          className="absolute top-2 left-1/2 h-10 -translate-x-1/2"
        >
          <TabsList className="bg-sidebar border-2 p-0">
            <TabsTrigger
              value="groups"
              className="w-32 rounded-r-none border-none px-4 text-lg"
            >
              Groups
            </TabsTrigger>
            <ButtonGroupSeparator />
            <TabsTrigger
              value="brackets"
              className="w-32 rounded-l-none border-none px-4 text-lg"
            >
              Brackets
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {user && <UserDropdown user={user} className="-mr-2 scale-95" />}
      </Header>
      <BuilderSidebar
        tournamentId={tournamentId}
        onEditTournament={() => {
          if (!isReadOnly) {
            setShowEditTournament(true);
          }
        }}
        onDeleteTournament={() => {
          if (!isReadOnly) {
            setShowDeleteTournament(true);
          }
        }}
        readOnly={isReadOnly}
      />

      <main className="flex h-dvh flex-1 flex-col">
        <div className="relative flex-1 p-6">
          {isReadOnly ? (
            <Alert className="max-w-xl">
              <AlertTitle>Read-only workspace</AlertTitle>
              <AlertDescription>
                This tournament is completed. Builder mutations are disabled so
                results stay locked.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </main>

      {/* Dialogs */}
      <AddGroupDialog
        open={showAddGroup}
        onOpenChange={setShowAddGroup}
        tournamentId={tournamentId}
      />
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
    </SidebarProvider>
  );
}
