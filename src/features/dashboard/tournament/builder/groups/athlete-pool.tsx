import * as React from 'react';
import { Search, UserPlus } from 'lucide-react';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { useAssignAthlete } from '@/queries/groups';

interface AthletePoolProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function AthletePool({
  tournamentId,
  groups,
  readOnly,
}: AthletePoolProps) {
  const [search, setSearch] = React.useState('');
  const [genderFilter, setGenderFilter] = React.useState<string>('all');

  const { data: athletes, isPending } = useTournamentAthletes({
    tournamentId,
    unassignedOnly: false,
    page: 1,
    perPage: 200,
    sorting: [],
  });

  const unassigned = React.useMemo(() => {
    const items = athletes?.items ?? [];
    return items.filter((a: TournamentAthleteData) => a.groupId === null);
  }, [athletes]);

  const filtered = React.useMemo(() => {
    let result = unassigned;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a: TournamentAthleteData) =>
          a.name.toLowerCase().includes(q) ||
          a.affiliation.toLowerCase().includes(q)
      );
    }

    if (genderFilter !== 'all') {
      result = result.filter(
        (a: TournamentAthleteData) => a.gender === genderFilter
      );
    }

    return result;
  }, [unassigned, search, genderFilter]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Unassigned Athletes</h3>
          <Badge variant="secondary">{unassigned.length}</Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search name or affiliation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center text-sm">
            <UserPlus className="size-8 opacity-50" />
            {unassigned.length === 0
              ? 'All athletes are assigned to groups'
              : 'No athletes match your filters'}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((athlete: TournamentAthleteData) => (
              <AthletePoolRow
                key={athlete.id}
                athlete={athlete}
                groups={groups}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AthletePoolRowProps {
  athlete: TournamentAthleteData;
  groups: Array<GroupData>;
  readOnly: boolean;
}

function AthletePoolRow({ athlete, groups, readOnly }: AthletePoolRowProps) {
  const assignMutation = useAssignAthlete();
  const [selectedGroup, setSelectedGroup] = React.useState<string>('');

  const handleAssign = () => {
    if (!selectedGroup) return;
    assignMutation.mutate({
      groupId: selectedGroup,
      tournamentAthleteId: athlete.id,
    });
    setSelectedGroup('');
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{athlete.name}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {athlete.gender}
          </Badge>
          <span className="text-muted-foreground text-[10px]">
            Belt {athlete.beltLevel}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {athlete.weight}kg
          </span>
        </div>
      </div>

      {!readOnly && groups.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="h-7 w-24 text-[10px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={handleAssign}
            disabled={!selectedGroup || assignMutation.isPending}
          >
            <UserPlus className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
